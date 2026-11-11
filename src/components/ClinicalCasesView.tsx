import React, { useState } from 'react';
import { Plus, Search, Filter, Calendar, Building, FileText, ChevronRight, Trash2, Edit3, ShieldAlert, CheckCircle2, X, Download } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { translations } from '../lib/i18n';
import { ClinicalCase } from '../types';
import { AddCaseModal } from './AddCaseModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ClinicalCasesView: React.FC = () => {
  const { cases, addCase, updateCase, deleteCase } = useData();
  const { language } = useAuth();
  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';

  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'age'>('date_desc');
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<ClinicalCase | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCase, setEditingCase] = useState<ClinicalCase | null>(null);
  const [caseToDelete, setCaseToDelete] = useState<ClinicalCase | null>(null);
  const [attachmentToDelete, setAttachmentToDelete] = useState<number | null>(null);
  const [isDeletingAttachment, setIsDeletingAttachment] = useState(false);

  const specialties = Array.from(new Set(['All', ...cases.map(c => c.specialty).filter(Boolean)]));

  const filtered = cases
    .filter(c => {
      const q = search.toLowerCase();
      const matchSearch =
        c.caseReference.toLowerCase().includes(q) ||
        c.primaryDiagnosis.toLowerCase().includes(q) ||
        c.hospital.toLowerCase().includes(q) ||
        c.chiefComplaint.toLowerCase().includes(q) ||
        (c.surgicalProcedure?.procedureName && c.surgicalProcedure.procedureName.toLowerCase().includes(q));
      const matchSpec = selectedSpecialty === 'All' || c.specialty === selectedSpecialty;
      return matchSearch && matchSpec;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.presentationDate).getTime() - new Date(a.presentationDate).getTime();
      if (sortBy === 'date_asc') return new Date(a.presentationDate).getTime() - new Date(b.presentationDate).getTime();
      return b.patientAge - a.patientAge;
    });

  const exportCaseExcel = (c: ClinicalCase) => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['SURGITRACK CLINICAL CASE LOGBOOK RECORD'],
      ['Case Reference:', c.caseReference],
      ['Presentation Date:', c.presentationDate],
      ['Patient Age / Sex:', `${c.patientAge} Y / ${c.patientSex || 'Undisclosed'}`],
      ['Hospital & Department:', `${c.hospital} - ${c.department}`],
      ['Surgical Specialty:', c.specialty],
      [''],
      ['CLINICAL PRESENTATION & HISTORY'],
      ['Chief Complaint:', c.chiefComplaint],
      ['Duration of Symptoms:', c.durationOfSymptoms],
      ['History of Present Illness:', c.historyOfPresentIllness],
      ['Relevant Medical History:', c.relevantMedicalHistory],
      ['Past Surgical History:', c.surgicalHistory],
      ['Drug History & Allergies:', `${c.drugHistory} | Allergies: ${c.allergies}`],
      [''],
      ['DIAGNOSIS & MANAGEMENT'],
      ['Primary Diagnosis:', c.primaryDiagnosis],
      ['ICD-10 Code:', c.icd10Code || 'N/A'],
      ['Secondary Diagnoses:', c.secondaryDiagnoses || 'N/A'],
      ['Initial & Surgical Management:', `${c.management?.initial || ''} | ${c.management?.surgical || ''}`],
      ['Outcome:', c.management?.outcome || 'Uneventful'],
    ];

    if (c.surgicalProcedure) {
      rows.push(
        [''],
        ['SURGICAL PROCEDURE DETAILS'],
        ['Procedure Name:', c.surgicalProcedure.procedureName],
        ['Procedure Date:', c.surgicalProcedure.procedureDate],
        ['Participation Role:', c.surgicalProcedure.participationRole],
        ['Operative Approach:', c.surgicalProcedure.surgicalApproach],
        ['Operative Findings:', c.surgicalProcedure.operativeFindings],
        ['Procedure Summary:', c.surgicalProcedure.procedureSummary]
      );
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Case Report');
    XLSX.writeFile(wb, `SurgiTrack_${c.caseReference}_Record.xlsx`);
  };

  const exportCasePDF = (c: ClinicalCase) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFillColor(16, 28, 50);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`SURGITRACK | CLINICAL CASE: ${c.caseReference}`, 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Anonymized Surgical Logbook Portfolio Record', 14, 18);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Presentation & Clinical Baseline', 14, 32);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Presentation Date: ${c.presentationDate} | Age: ${c.patientAge} Years (${c.patientSex || 'Undisclosed'})`, 14, 38);
    doc.text(`Hospital: ${c.hospital} - ${c.department} (${c.specialty})`, 14, 43);
    doc.text(`Chief Complaint: ${c.chiefComplaint}`, 14, 48);

    autoTable(doc, {
      startY: 54,
      head: [['Clinical Dimension', 'Documented Clinical Information']],
      body: [
        ['History of Present Illness', c.historyOfPresentIllness || 'N/A'],
        ['Relevant Medical & Surgical History', `${c.relevantMedicalHistory || 'Nil'} | Prior Ops: ${c.surgicalHistory || 'Nil'}`],
        ['Primary Diagnosis', `${c.primaryDiagnosis} (ICD-10: ${c.icd10Code || 'N/A'})`],
        ['Clinical Assessment', c.clinicalAssessment || 'N/A'],
        ['Surgical Procedure', c.surgicalProcedure ? `${c.surgicalProcedure.procedureName} [${c.surgicalProcedure.participationRole}]` : 'Non-operative management'],
        ['Operative Summary', c.surgicalProcedure?.procedureSummary || 'N/A'],
        ['Wound Status & Follow-up', `${c.followUp?.woundStatus || 'Clean'} | ${c.followUp?.clinicalProgress || 'Recovered'}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] },
      styles: { fontSize: 8 },
    });

    doc.save(`SurgiTrack_${c.caseReference}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#101C32] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-1 rounded-md border border-teal-500/30">
            Section 5: Anonymized Clinical Cases Logbook
          </span>
          <h2 className="text-xl font-bold tracking-tight mt-2">
            {t.cases}
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            {isRTL
              ? 'توثيق زمني مفصل للحالات السريرية من الفحص الأولي والاستقصاءات حتى التدخل الجراحي والمتابعة.'
              : language === 'de'
              ? 'Vollständige chronologische Dokumentation von der klinischen Erstuntersuchung über die OP bis zur postoperativen Nachsorge.'
              : 'Complete chronological documentation from initial triage through investigations, surgical intervention, and post-operative follow-up.'}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCase(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-teal-950/30 cursor-pointer"
        >
          <Plus size={16} /> + {t.addNewCase}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none">
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
          >
            {specialties.map((spec, idx) => (
              <option key={`spec-${spec}-${idx}`} value={spec}>{spec}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
          >
            <option value="date_desc">Newest Presentation</option>
            <option value="date_asc">Oldest Presentation</option>
            <option value="age">Patient Age</option>
          </select>
        </div>
      </div>

      {/* Cases Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c, idx) => (
            <div
              key={c.id ? `${c.id}-${idx}` : `case-${c.caseReference || idx}-${idx}`}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-400 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                      {c.caseReference}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Age {c.patientAge} • {c.patientSex || 'Undisclosed'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCase(c);
                        setShowAddModal(true);
                      }}
                      className="p-1 text-slate-400 hover:text-teal-700"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => setCaseToDelete(c)}
                      className="p-1 text-slate-400 hover:text-red-700 transition cursor-pointer"
                      title={isRTL ? 'حذف الحالة السريرية' : 'Delete Case'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                  {c.primaryDiagnosis}
                </h3>

                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {c.chiefComplaint}
                </p>

                {c.surgicalProcedure && (
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div className="truncate max-w-[240px]">
                      <span className="text-[10px] uppercase font-bold text-teal-700 block">Procedure</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {c.surgicalProcedure.procedureName}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                      {c.surgicalProcedure.participationRole}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="truncate max-w-[150px]">{c.hospital}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingCase(c);
                      setShowAddModal(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-teal-700 rounded-md hover:bg-teal-50 transition"
                    title={isRTL ? 'تعديل الحالة' : 'Edit Case'}
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => setCaseToDelete(c)}
                    className="p-1.5 text-slate-400 hover:text-red-700 rounded-md hover:bg-red-50 transition cursor-pointer"
                    title={isRTL ? 'حذف الحالة' : 'Delete Case'}
                  >
                    <Trash2 size={13} />
                  </button>
                  <button
                    onClick={() => exportCaseExcel(c)}
                    className="p-1.5 text-slate-400 hover:text-teal-700 rounded-md hover:bg-slate-100 transition"
                    title="Export Excel"
                  >
                    <Download size={13} />
                  </button>
                  <button
                    onClick={() => setSelectedCaseDetail(c)}
                    className="flex items-center gap-1 font-bold text-teal-700 hover:text-teal-900 cursor-pointer ml-1"
                  >
                    <span>{isRTL ? 'عرض الملف' : 'Full Logbook'}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-xs text-slate-400">
          No clinical cases recorded yet. Click <strong>+ Add New Clinical Case</strong> above.
        </div>
      )}

      {/* Case Detailed Modal (Section 5.10 Chronological view) */}
      {selectedCaseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="bg-[#101C32] text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="font-mono text-xs sm:text-sm font-bold bg-teal-500/20 text-teal-300 px-2.5 sm:px-3 py-1 rounded-lg border border-teal-500/40 shrink-0">
                  {selectedCaseDetail.caseReference}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base truncate">{selectedCaseDetail.primaryDiagnosis}</h3>
                  <p className="text-[11px] sm:text-xs text-slate-300 truncate">
                    {selectedCaseDetail.hospital} • {selectedCaseDetail.presentationDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 justify-end">
                <button
                  onClick={() => {
                    setEditingCase(selectedCaseDetail);
                    setSelectedCaseDetail(null);
                    setShowAddModal(true);
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition"
                  title={isRTL ? 'تعديل الحالة' : 'Edit Case'}
                >
                  <Edit3 size={13} />
                  <span>{isRTL ? 'تعديل' : 'Edit'}</span>
                </button>
                <button
                  onClick={() => setCaseToDelete(selectedCaseDetail)}
                  className="bg-red-800/80 hover:bg-red-700 text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition"
                  title={isRTL ? 'حذف الحالة' : 'Delete Case'}
                >
                  <Trash2 size={13} />
                  <span>{isRTL ? 'حذف' : 'Delete'}</span>
                </button>
                <button
                  onClick={() => exportCasePDF(selectedCaseDetail)}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} /> PDF
                </button>
                <button
                  onClick={() => setSelectedCaseDetail(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 bg-[#FBFDFE]">
              {/* Chronological Section 1: Presentation & History */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-teal-700">
                  1. Presentation & Clinical History
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div><strong>Patient Demographics:</strong> {selectedCaseDetail.patientAge} Years, {selectedCaseDetail.patientSex || 'Undisclosed'}</div>
                  <div><strong>Presentation Date:</strong> {selectedCaseDetail.presentationDate}</div>
                  <div><strong>Chief Complaint:</strong> {selectedCaseDetail.chiefComplaint}</div>
                  <div><strong>Duration:</strong> {selectedCaseDetail.durationOfSymptoms || 'N/A'}</div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <strong>History of Present Illness:</strong>
                  <p className="mt-1 leading-relaxed text-slate-600">{selectedCaseDetail.historyOfPresentIllness}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div><strong>Medical History:</strong> {selectedCaseDetail.relevantMedicalHistory || 'Nil'}</div>
                  <div><strong>Surgical History:</strong> {selectedCaseDetail.surgicalHistory || 'Nil'}</div>
                  <div><strong>Medications:</strong> {selectedCaseDetail.drugHistory || 'Nil'}</div>
                  <div><strong>Allergies:</strong> {selectedCaseDetail.allergies}</div>
                </div>
              </div>

              {/* Section 2: Clinical Examination */}
              {selectedCaseDetail.examination && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-teal-700">
                    2. Physical Examination Findings
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedCaseDetail.examination.vitals && <div><strong>Vitals:</strong> {selectedCaseDetail.examination.vitals}</div>}
                    {selectedCaseDetail.examination.general && <div><strong>General:</strong> {selectedCaseDetail.examination.general}</div>}
                    {selectedCaseDetail.examination.cardiovascular && <div><strong>Cardiovascular:</strong> {selectedCaseDetail.examination.cardiovascular}</div>}
                    {selectedCaseDetail.examination.respiratory && <div><strong>Respiratory:</strong> {selectedCaseDetail.examination.respiratory}</div>}
                    {selectedCaseDetail.examination.abdominal && <div><strong>Abdominal:</strong> {selectedCaseDetail.examination.abdominal}</div>}
                    {selectedCaseDetail.examination.local && <div><strong>Local / Surgical:</strong> {selectedCaseDetail.examination.local}</div>}
                  </div>
                </div>
              )}

              {/* Section 3: Investigations */}
              {selectedCaseDetail.investigations.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-teal-700">
                    3. Documented Investigations
                  </h4>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-1">Test</th>
                        <th className="py-1">Result</th>
                        <th className="py-1">Clinical Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedCaseDetail.investigations.map((inv, idx) => (
                        <tr key={`inv-${idx}-${inv.name}`}>
                          <td className="py-1 font-medium">{inv.name}</td>
                          <td className="py-1">{inv.result}</td>
                          <td className="py-1 text-slate-500">{inv.summary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Section 4: Operative Procedure */}
              {selectedCaseDetail.surgicalProcedure && (
                <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-200 space-y-2">
                  <h4 className="font-bold text-teal-950 text-xs uppercase tracking-wider">
                    4. Surgical Procedure & Operative Record
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>Procedure:</strong> {selectedCaseDetail.surgicalProcedure.procedureName}</div>
                    <div><strong>Date:</strong> {selectedCaseDetail.surgicalProcedure.procedureDate}</div>
                    <div><strong>Participation:</strong> {selectedCaseDetail.surgicalProcedure.participationRole}</div>
                    <div><strong>Anaesthesia:</strong> {selectedCaseDetail.surgicalProcedure.anaesthesiaType}</div>
                  </div>
                  <div className="pt-2 border-t border-teal-100">
                    <strong>Operative Findings:</strong> {selectedCaseDetail.surgicalProcedure.operativeFindings}
                  </div>
                  <div className="pt-1">
                    <strong>Operative Summary:</strong> {selectedCaseDetail.surgicalProcedure.procedureSummary}
                  </div>
                </div>
              )}

              {/* Section 5: Follow-up & Progress */}
              {selectedCaseDetail.followUp && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-teal-700">
                    5. Clinical Course & Follow-up
                  </h4>
                  <div><strong>Wound Status:</strong> {selectedCaseDetail.followUp.woundStatus}</div>
                  <div><strong>Progress:</strong> {selectedCaseDetail.followUp.clinicalProgress}</div>
                </div>
              )}

              {/* Section 6: De-identified Clinical Attachments & Media */}
              {selectedCaseDetail.attachments && selectedCaseDetail.attachments.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-teal-700">
                      6. Educational Media & Clinical Attachments ({selectedCaseDetail.attachments.length})
                    </h4>
                    <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono">
                      Strictly De-identified
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedCaseDetail.attachments.map((att, idx) => (
                      <div key={att.id || idx} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 relative group shadow-2xs">
                        {att.url.startsWith('data:image') || att.url.startsWith('http') ? (
                          <img
                            src={att.url}
                            alt={att.title}
                            className="w-full h-28 object-cover hover:scale-105 transition"
                          />
                        ) : (
                          <div className="w-full h-28 flex flex-col items-center justify-center bg-slate-100 text-slate-500">
                            <FileText size={28} />
                            <span className="text-[10px] mt-1 font-medium">{att.type}</span>
                          </div>
                        )}
                        <div className="p-2 bg-white border-t border-slate-100">
                          <p className="font-bold text-[11px] text-slate-800 truncate" title={att.title}>
                            {att.title || 'Clinical Photo'}
                          </p>
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-50 text-[10px]">
                            <span className="text-teal-700 font-semibold">{att.type.replace('_', ' ')}</span>
                            <button
                              type="button"
                              onClick={() => setAttachmentToDelete(idx)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition cursor-pointer"
                              title={isRTL ? 'حذف المرفق' : 'Delete Attachment'}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Case Modal */}
      {showAddModal && (
        <AddCaseModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingCase(null);
          }}
          existingCase={editingCase}
          onSave={async (c, publishToCommunity) => {
            if (editingCase) {
              const updates: Partial<ClinicalCase> = {
                ...c,
                ...(publishToCommunity !== undefined ? { isPublished: publishToCommunity } : {})
              };
              await updateCase(editingCase.id, updates);
              return editingCase.id;
            } else {
              return await addCase(c, publishToCommunity ?? false);
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {caseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-800 space-y-4 shadow-2xl border border-red-200 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {isRTL ? 'تأكيد حذف الحالة السريرية' : 'Confirm Case Deletion'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isRTL
                ? `هل أنت متأكد من رغبتك في حذف الحالة السريرية (${caseToDelete.caseReference}) نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to permanently delete case (${caseToDelete.caseReference})? This action cannot be undone.`}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setCaseToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  await deleteCase(caseToDelete.id);
                  setCaseToDelete(null);
                  setSelectedCaseDetail(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition cursor-pointer shadow-xs"
              >
                {isRTL ? 'نعم، حذف نهائي' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Attachment Confirmation Modal */}
      {attachmentToDelete !== null && selectedCaseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-800 space-y-4 shadow-2xl border border-red-200 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {isRTL ? 'تأكيد حذف المرفق' : 'Delete Clinical Media Attachment?'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isRTL
                ? 'هل أنت متأكد من حذف هذا الملف التعليمي المرفق من سجل الحالة نهائياً؟'
                : 'Are you sure you want to remove this media attachment from this clinical case record?'}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                disabled={isDeletingAttachment}
                onClick={() => setAttachmentToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                disabled={isDeletingAttachment}
                onClick={async () => {
                  if (attachmentToDelete === null || !selectedCaseDetail) return;
                  setIsDeletingAttachment(true);
                  try {
                    const updatedAttachments = (selectedCaseDetail.attachments || []).filter(
                      (_, idx) => idx !== attachmentToDelete
                    );
                    await updateCase(selectedCaseDetail.id, { attachments: updatedAttachments });
                    setSelectedCaseDetail({
                      ...selectedCaseDetail,
                      attachments: updatedAttachments,
                    });
                    setAttachmentToDelete(null);
                  } finally {
                    setIsDeletingAttachment(false);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeletingAttachment
                  ? (isRTL ? 'جارٍ الحذف...' : 'Deleting...')
                  : (isRTL ? 'نعم، حذف' : 'Yes, Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
