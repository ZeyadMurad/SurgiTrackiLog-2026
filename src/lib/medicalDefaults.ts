export interface DefaultSkillDefinition {
  name: string;
  nameGerman: string;
  specialty: string;
  category: string;
}

export const DEFAULT_SURGICAL_SKILLS: DefaultSkillDefinition[] = [
  // General Surgery
  { name: 'Surgical Hand Scrubbing & Aseptic Preparation', nameGerman: 'Chirurgische Händedesinfektion & Waschung', specialty: 'General Surgery', category: 'Sterile Field & Basics' },
  { name: 'Sterile Gowning and Closed Gloving', nameGerman: 'Steriles Ankleiden und Handschuhe anlegen', specialty: 'General Surgery', category: 'Sterile Field & Basics' },
  { name: 'Surgical Instrument & Retractor Handling', nameGerman: 'Handhabung chirurgischer Instrumente', specialty: 'General Surgery', category: 'Instrumentation' },
  { name: 'Deep & Subcutaneous Tissue Suturing', nameGerman: 'Chirurgische Nahttechniken', specialty: 'General Surgery', category: 'Tissue Handling' },
  { name: 'Knot Tying (One-Handed & Instrument)', nameGerman: 'Chirurgische Knotentechniken (einhändig/zweihändig)', specialty: 'General Surgery', category: 'Tissue Handling' },
  { name: 'Skin Closure (Interrupted, Subcuticular, Staples)', nameGerman: 'Hautverschluss (Einzelknopf, Intrakutan, Klammern)', specialty: 'General Surgery', category: 'Wound Closure' },
  { name: 'Wound Debridement & Negative Pressure Dressing', nameGerman: 'Wundbehandlung und Débridement', specialty: 'General Surgery', category: 'Wound Management' },
  { name: 'Incision and Drainage of Deep Abscesses', nameGerman: 'Inzision und Drainage von Abszessen', specialty: 'General Surgery', category: 'Operative Procedures' },
  { name: 'Surgical Exposure & Laparotomy Incision', nameGerman: 'Chirurgische Exposition und Situs-Darstellung', specialty: 'General Surgery', category: 'Operative Procedures' },
  { name: 'Laparotomy Assistance & Retractor Placement', nameGerman: 'Assistenz bei Laparotomien', specialty: 'General Surgery', category: 'Operative Procedures' },
  { name: 'Laparoscopic Port Insertion & Hasson Technique', nameGerman: 'Laparoskopische Trokarplatzierung', specialty: 'General Surgery', category: 'Minimally Invasive' },
  { name: 'Laparoscopic Appendectomy Assistance', nameGerman: 'Assistenz bei laparoskopischer Appendektomie', specialty: 'General Surgery', category: 'Minimally Invasive' },
  { name: 'Laparoscopic Cholecystectomy - Calot Dissection', nameGerman: 'Assistenz bei Cholezystektomie', specialty: 'General Surgery', category: 'Minimally Invasive' },
  { name: 'Open Inguinal Hernia Lichtenstein Mesh Repair', nameGerman: 'Leistenhernien-OP nach Lichtenstein', specialty: 'General Surgery', category: 'Hernia Surgery' },
  { name: 'Small Bowel Resection & Hand-Sewn Anastomosis', nameGerman: 'Dünndarmanastomose (Handnaht)', specialty: 'General Surgery', category: 'Gastrointestinal' },
  { name: 'Stapled Colorectal / Gastrointestinal Anastomosis', nameGerman: 'Klammernaht-Anastomose', specialty: 'General Surgery', category: 'Gastrointestinal' },
  { name: 'Abdominal Wall Mass Closure with Loop Suture', nameGerman: 'Bauchdeckenverschluss (Schlingen-Naht)', specialty: 'General Surgery', category: 'Wound Closure' },

  // Vascular Surgery
  { name: 'Peripheral Vascular Examination & Pulse Mapping', nameGerman: 'Periphere Gefäßuntersuchung', specialty: 'Vascular Surgery', category: 'Clinical Assessment' },
  { name: 'Handheld Continuous-Wave Doppler & ABI Measurement', nameGerman: 'Doppler-Ultraschalluntersuchung & ABI', specialty: 'Vascular Surgery', category: 'Non-Invasive Diagnostics' },
  { name: 'Arterial & Venous Cannulation (Sheath Placement)', nameGerman: 'Gefäßpunktion & Gefäßzugänge (Arteriell/Venös)', specialty: 'Vascular Surgery', category: 'Access & Cannulation' },
  { name: 'Femoral Artery Bifurcation Exposure & Vessel Looping', nameGerman: 'Freilegung der A. femoralis', specialty: 'Vascular Surgery', category: 'Operative Dissection' },
  { name: 'Carotid Artery Dissection & Nerve Identification', nameGerman: 'Präparation der A. carotis', specialty: 'Vascular Surgery', category: 'Operative Dissection' },
  { name: 'Vascular Clamping & Systemic Heparin Monitoring', nameGerman: 'Gefäßausklemmung und Heparinisierung', specialty: 'Vascular Surgery', category: 'Vascular Control' },
  { name: 'Arteriotomy & Patch-Plasty Reconstruction', nameGerman: 'Arteriotomie und Patchplastik', specialty: 'Vascular Surgery', category: 'Vascular Reconstruction' },
  { name: 'Continuous Vascular Suturing (Prolene 5-0/6-0/7-0)', nameGerman: 'Gefäßnaht (fortlaufend mit Prolene)', specialty: 'Vascular Surgery', category: 'Vascular Reconstruction' },
  { name: 'End-to-Side Arterial Anastomosis (Parachute Technique)', nameGerman: 'Arterielle Anastomose (End-zu-Seit)', specialty: 'Vascular Surgery', category: 'Vascular Reconstruction' },
  { name: 'Great Saphenous Vein Harvesting & Hydrostatic Testing', nameGerman: 'Venenentnahme (V. saphena magna)', specialty: 'Vascular Surgery', category: 'Graft Preparation' },
  { name: 'Femoro-Popliteal Bypass Graft Tunneling & Anastomosis', nameGerman: 'Peripherer Bypass (femoro-popliteal)', specialty: 'Vascular Surgery', category: 'Bypass Surgery' },
  { name: 'Balloon Catheter Thromboembolectomy (Fogarty)', nameGerman: 'Fogarty-Katheter-Thrombembolektomie', specialty: 'Vascular Surgery', category: 'Emergency Interventions' },
  { name: 'Diagnostic Digital Subtraction Angiography (DSA)', nameGerman: 'Periphere Angiographie (DSA)', specialty: 'Vascular Surgery', category: 'Endovascular' },
  { name: 'Endovascular Guidewire Navigation & Balloon Angioplasty (PTA)', nameGerman: 'Ballondilatation (PTA)', specialty: 'Vascular Surgery', category: 'Endovascular' },
  { name: 'Endovascular Aortic Aneurysm Repair (EVAR) Deployment', nameGerman: 'Endovaskuläre Aortenausschaltung (EVAR)', specialty: 'Vascular Surgery', category: 'Endovascular' },
  { name: 'Arteriovenous (AV) Hemodialysis Fistula Creation (Cimino)', nameGerman: 'Anlage eines Dialyseshunts', specialty: 'Vascular Surgery', category: 'Vascular Access' },

  // Pediatric Surgery
  { name: 'Neonatal Vascular Access & Venous Cutdown', nameGerman: 'Pädiatrischer Venenkatheter', specialty: 'Pediatric Surgery', category: 'Vascular Access' },
  { name: 'Pediatric Inguinal Herniotomy / High Ligation', nameGerman: 'Pädiatrische Herniotomie', specialty: 'Pediatric Surgery', category: 'Core Pediatric' },
  { name: 'Umbilical Hernia Closure in Infants', nameGerman: 'Nabelhernienverschluss beim Kind', specialty: 'Pediatric Surgery', category: 'Core Pediatric' },
  { name: 'Pyloromyotomy for Infantile Hypertrophic Pyloric Stenosis (Ramstedt)', nameGerman: 'Pyloromyotomie nach Ramstedt', specialty: 'Pediatric Surgery', category: 'Gastrointestinal' },
  { name: 'Laparoscopic Appendectomy in Pediatric Patients', nameGerman: 'Laparoskopische Appendektomie beim Kind', specialty: 'Pediatric Surgery', category: 'Minimally Invasive' },
  { name: 'Intussusception Hydrostatic / Surgical Reduction', nameGerman: 'Invaginationsbehandlung', specialty: 'Pediatric Surgery', category: 'Emergency Surgery' },
  { name: 'Orchidopexy for Undescended Testis (Cryptorchidism)', nameGerman: 'Orchidopexie bei Maldescensus testis', specialty: 'Pediatric Surgery', category: 'Genitourinary' },
  { name: 'Subcutaneous Broviac / Port-a-Cath Central Line Placement', nameGerman: 'Port-Implantation bei Kindern', specialty: 'Pediatric Surgery', category: 'Vascular Access' },
  { name: 'Circumcision / Plasty for Phimosis', nameGerman: 'Zirkumzision / Phimosen-OP', specialty: 'Pediatric Surgery', category: 'Genitourinary' },

  // Cardiothoracic Surgery
  { name: 'Median Sternotomy & Sternal Retractor Application', nameGerman: 'Mediane Sternotomie', specialty: 'Cardiothoracic Surgery', category: 'Surgical Exposure' },
  { name: 'Aortic & Venous Cannulation for Cardiopulmonary Bypass (CPB)', nameGerman: 'Kanülierung für Herz-Lungen-Maschine', specialty: 'Cardiothoracic Surgery', category: 'Perfusion & Access' },
  { name: 'Left Internal Mammary Artery (LIMA) Pedicle Harvesting', nameGerman: 'LIMA-Präparation für CABG', specialty: 'Cardiothoracic Surgery', category: 'Coronary Revascularization' },
  { name: 'Coronary Artery Microvascular Anastomosis (7-0/8-0)', nameGerman: 'Koronaranastomose', specialty: 'Cardiothoracic Surgery', category: 'Coronary Revascularization' },
  { name: 'Aortic Valve Replacement Exposure & Suture Placement', nameGerman: 'Aortenklappenersatz-Assistenz', specialty: 'Cardiothoracic Surgery', category: 'Valvular Surgery' },
  { name: 'Tube Thoracostomy (Intercostal Chest Drain Insertion)', nameGerman: 'Thoraxdrainage-Anlage (Bülau)', specialty: 'Cardiothoracic Surgery', category: 'Thoracic Interventions' },
  { name: 'Video-Assisted Thoracoscopic Surgery (VATS) Port Access', nameGerman: 'VATS-Thorakoskopie Zugang', specialty: 'Cardiothoracic Surgery', category: 'Minimally Invasive' },
  { name: 'Pulmonary Wedge Resection & Stapling', nameGerman: 'Keilresektion der Lunge', specialty: 'Cardiothoracic Surgery', category: 'Thoracic Surgery' },
  { name: 'Stainless Steel Wire Sternal Closure', nameGerman: 'Sternaler Drahtverschluss', specialty: 'Cardiothoracic Surgery', category: 'Wound Closure' },

  // Neurosurgery
  { name: 'Craniotomy Skin Flap Design & Subgaleal Dissection', nameGerman: 'Kraniotomie-Schnittführung & Skalpierung', specialty: 'Neurosurgery', category: 'Cranial Exposure' },
  { name: 'High-Speed Perforator Burr Hole Creation', nameGerman: 'Bohrlochtrepanation', specialty: 'Neurosurgery', category: 'Cranial Exposure' },
  { name: 'Craniotomy Bone Flap Elevation & Hemostatic Waxing', nameGerman: 'Knochendeckel-Elevation & Knochenwachs', specialty: 'Neurosurgery', category: 'Cranial Exposure' },
  { name: 'Microsurgical Dural Opening & Tentorial Tacking', nameGerman: 'Duraeröffnung unter OP-Mikroskop', specialty: 'Neurosurgery', category: 'Microsurgery' },
  { name: 'External Ventricular Drain (EVD) Placement (Kocher Point)', nameGerman: 'Externe Ventrikeldrainage (EVD)', specialty: 'Neurosurgery', category: 'CSF Diversion' },
  { name: 'Lumbar Spine Microdiscectomy Flavectomy & Nerve Root Retraction', nameGerman: 'Lumbale Mikrodisektomie', specialty: 'Neurosurgery', category: 'Spine Surgery' },
  { name: 'Neuronavigation Registration & Target Calibration', nameGerman: 'Kalibrierung der Neuronavigation', specialty: 'Neurosurgery', category: 'Image-Guided Surgery' },
  { name: 'Watertight Primary Dural Repair with 4-0/5-0 Neurological Suture', nameGerman: 'Wasserdichter Duraverschluss', specialty: 'Neurosurgery', category: 'Tissue Closure' },

  // Trauma & Orthopaedic Surgery
  { name: 'Diagnostic Joint Aspiration & Synovial Fluid Arthrocentesis', nameGerman: 'Gelenkpunktion & Aspiration', specialty: 'Trauma & Orthopaedic Surgery', category: 'Diagnostics' },
  { name: 'Closed Fracture Reduction & Bi-valved Plaster Immobilization', nameGerman: 'Geschlossene Frakturreposition & Gipsanlage', specialty: 'Trauma & Orthopaedic Surgery', category: 'Immobilization' },
  { name: 'Skeletal Traction Pin Insertion (Steinmann / Denham)', nameGerman: 'Extensionsbehandlung (Steinmann-Nagel)', specialty: 'Trauma & Orthopaedic Surgery', category: 'Trauma Stabilization' },
  { name: 'Spanning External Fixator Application for Complex Fractures', nameGerman: 'Fixateur externe Montage', specialty: 'Trauma & Orthopaedic Surgery', category: 'Fracture Fixation' },
  { name: 'Closed Intramedullary Nailing for Long Bone Fractures (Femur/Tibia)', nameGerman: 'Marknagelung (Femur/Tibia)', specialty: 'Trauma & Orthopaedic Surgery', category: 'Fracture Fixation' },
  { name: 'Open Reduction & Internal Fixation (ORIF) with LC-DCP Plates', nameGerman: 'Plattenosteosynthese (ORIF)', specialty: 'Trauma & Orthopaedic Surgery', category: 'Fracture Fixation' },
  { name: 'Diagnostic Knee Arthroscopy & Meniscal Debridement', nameGerman: 'Kniegelenksarthroskopie & Meniskusglättung', specialty: 'Trauma & Orthopaedic Surgery', category: 'Arthroscopy' },
  { name: 'Emergency Limb Compartment Pressure Measurement & Fasciotomy', nameGerman: 'Druckmessung & Notfall-Fasziotomie', specialty: 'Trauma & Orthopaedic Surgery', category: 'Emergency Interventions' },
  { name: 'Total Knee / Hip Arthroplasty Component Alignment Assistance', nameGerman: 'Assistenz bei Endoprothetik (Knie/Hüfte)', specialty: 'Trauma & Orthopaedic Surgery', category: 'Arthroplasty' },

  // Urology
  { name: 'Difficult Urethral Catheterization & Coude / Guidewire Insertion', nameGerman: 'Schwierige Katheterisierung', specialty: 'Urology', category: 'Core Urology' },
  { name: 'Percutaneous Suprapubic Cystostomy Insertion (Cystofix)', nameGerman: 'Suprapubische Zystostomie', specialty: 'Urology', category: 'Core Urology' },
  { name: 'Rigid & Flexible Diagnostic Urethrocystoscopy', nameGerman: 'Urethrozystoskopie', specialty: 'Urology', category: 'Endourology' },
  { name: 'Retrograde Pyelography & Double-J (JJ) Stent Insertion', nameGerman: 'JJ-Harnleiterschiene Einlage', specialty: 'Urology', category: 'Endourology' },
  { name: 'Semi-Rigid Ureteroscopy (URS) for Ureteral Stone Management', nameGerman: 'Ureterorenoskopie (URS)', specialty: 'Urology', category: 'Endourology' },
  { name: 'Transurethral Resection of Bladder Tumor (TURBT) Assistance', nameGerman: 'TUR-Blase (TURBT)', specialty: 'Urology', category: 'Endourology' },
  { name: 'Transurethral Resection of Prostate (TURP) Assistance', nameGerman: 'TUR-Prostata (TURP)', specialty: 'Urology', category: 'Endourology' },
  { name: 'Scrotal Exploration for Suspected Testicular Torsion', nameGerman: 'Hodensack-Freilegung bei Hodentorsion', specialty: 'Urology', category: 'Emergency Urology' },
  { name: 'Hydrocele / Varicocele Surgical Excision & Eversion (Jaboulay)', nameGerman: 'Hydrozelen- / Varikozelen-OP', specialty: 'Urology', category: 'Scrotal Surgery' },

  // Plastic & Reconstructive Surgery
  { name: 'Split-Thickness Skin Graft (STSG) Harvesting with Dermatome', nameGerman: 'Spalthauttransplantation (STSG)', specialty: 'Plastic & Reconstructive Surgery', category: 'Skin Grafts' },
  { name: 'Full-Thickness Skin Graft (FTSG) Excision & Defatting', nameGerman: 'Vollhauttransplantation (FTSG)', specialty: 'Plastic & Reconstructive Surgery', category: 'Skin Grafts' },
  { name: 'Local Flap Transposition & Z-Plasty Scar Lengthening', nameGerman: 'Z-Plastik & Lokale Lappenplastik', specialty: 'Plastic & Reconstructive Surgery', category: 'Flap Surgery' },
  { name: 'Flexor & Extensor Tendon Repair (Modified Kessler Suture)', nameGerman: 'Sehnennaht (nach Kessler)', specialty: 'Plastic & Reconstructive Surgery', category: 'Hand Surgery' },
  { name: 'Microsurgical Vessel Preparation & Microvascular Anastomosis', nameGerman: 'Mikrovaskuläre Anastomose', specialty: 'Plastic & Reconstructive Surgery', category: 'Microsurgery' },
  { name: 'Burn Debridement & Tangential Eschar Excision', nameGerman: 'Nekrosektomie bei Verbrennungen', specialty: 'Plastic & Reconstructive Surgery', category: 'Burn Surgery' },

  // Surgical Oncology
  { name: 'Sentinel Lymph Node Biopsy with Radiotracer / Blue Dye', nameGerman: 'Sentinel-Lymphknoten-Biopsie', specialty: 'Surgical Oncology', category: 'Oncologic Procedures' },
  { name: 'Axillary Lymph Node Dissection (Levels I-III)', nameGerman: 'Axilläre Lymphonodektomie', specialty: 'Surgical Oncology', category: 'Oncologic Procedures' },
  { name: 'Wide Local Excision with Margin Assessment', nameGerman: 'Nachresektion mit Schnittrandbeurteilung', specialty: 'Surgical Oncology', category: 'Oncologic Procedures' },
  { name: 'PICC Line & Subcutaneous Chemotherapy Port Implantation', nameGerman: 'Port-a-Cath Implantation', specialty: 'Surgical Oncology', category: 'Vascular Access' },
];

export const getSkillsForSpecialty = (specialty: string): DefaultSkillDefinition[] => {
  if (!specialty || specialty === 'All') return DEFAULT_SURGICAL_SKILLS;
  const filtered = DEFAULT_SURGICAL_SKILLS.filter(s => s.specialty === specialty);
  return filtered.length > 0 ? filtered : DEFAULT_SURGICAL_SKILLS.filter(s => s.specialty === 'General Surgery');
};

export const INVESTIGATION_CATALOG = {
  Laboratory: [
    'CBC (Complete Blood Count)',
    'Urea and Creatinine (Renal Function)',
    'Electrolytes (Na, K, Cl, Ca)',
    'LFT (Liver Function Tests)',
    'Coagulation Profile (PT/INR, aPTT, Fibrinogen)',
    'CRP (C-Reactive Protein)',
    'ESR (Erythrocyte Sedimentation Rate)',
    'Blood Glucose',
    'HbA1c',
    'Blood Group and Crossmatch',
    'ABG (Arterial Blood Gas)',
    'D-Dimer',
    'Lipid Panel',
    'Urinalysis',
  ],
  Imaging: [
    'X-ray (Chest / Abdomen / Skeletal)',
    'Ultrasound (Abdominal / Soft Tissue)',
    'Doppler Ultrasound (Duplex Carotid / Peripheral)',
    'CT Scan (Computed Tomography)',
    'CT Angiography (CTA Head / Chest / Abdomen / Lower Limbs)',
    'MRI (Magnetic Resonance Imaging)',
    'MR Angiography (MRA)',
    'Echocardiography (TTE / TEE)',
  ],
  Cardiac: [
    'ECG (12-Lead Electrocardiogram)',
    'Cardiac Biomarkers (Troponin I/T, CK-MB, BNP)',
    'Exercise Stress Test',
    'Coronary Angiography',
  ],
};

export const SURGICAL_SPECIALTIES = [
  'General Surgery',
  'Vascular Surgery',
  'Cardiothoracic Surgery',
  'Neurosurgery',
  'Pediatric Surgery',
  'Trauma & Orthopaedic Surgery',
  'Surgical Oncology',
  'Transplant Surgery',
  'Plastic & Reconstructive Surgery',
  'Urology',
  'Ear, Nose & Throat (ENT / Otolaryngology)',
];

export const SUPERVISOR_POSITIONS = [
  'Consultant Surgeon',
  'Professor of Surgery',
  'Associate Professor',
  'Specialist Surgeon (Facharzt für Chirurgie)',
  'Senior Registrar (Oberarzt)',
  'Attending Surgeon',
  'Head of Surgical Department (Chefarzt)',
];

export const TRAINEE_POSITIONS = [
  'Clinical Volunteer',
  'Surgical Trainee',
  'Junior Doctor',
  'Medical Officer',
  'Resident (Assistenzarzt in Weiterbildung)',
  'Clinical Fellow',
];

// ==========================================
// STANDARDIZED DROPDOWN LISTS WITH DEFAULTS
// ==========================================

export const COMMON_HOSPITALS = [
  'University Medical Center',
  'Charité - Universitätsmedizin Berlin',
  'Universitätsklinikum Heidelberg',
  'Klinikum der Universität München (LMU)',
  'King Fahad Medical City',
  'Hamad General Hospital',
  'Sheikh Shakhbout Medical City',
  'American University of Beirut Medical Center',
  'National Guard Hospital',
  'Al-Amiri Hospital',
  'King Faisal Specialist Hospital & Research Centre',
];

export const COMMON_DEPARTMENTS = [
  'Department of General, Visceral & Transplant Surgery',
  'Department of Vascular & Endovascular Surgery',
  'Department of Trauma & Orthopaedic Surgery',
  'Department of Cardiothoracic Surgery',
  'Department of Surgical Oncology',
  'Department of Emergency Surgery',
  'Department of Pediatric Surgery',
];

export const COMMON_CHIEF_COMPLAINTS = [
  'Severe lower limb rest pain and ischemic dry necrosis of the first toe (Fontaine IV)',
  'Acute right lower quadrant abdominal pain with tenderness and vomiting for 24 hours',
  'Symptomatic internal carotid artery stenosis with transient monocular blindness (Amaurosis fugax)',
  'Asymptomatic pulsatile abdominal mass detected on ultrasound (Infrarenal AAA 5.6 cm)',
  'Acute right upper quadrant colicky pain radiating to right shoulder and fever (Acute cholecystitis)',
  'Painful, non-reducible swelling in right groin with nausea and constipation (Incarcerated hernia)',
  'Chronic severe intermittent claudication at 50 meters calf pain (Fontaine IIb)',
  'Acute sudden onset cold, pale, and pulseless right lower leg with numbness (Acute limb ischemia)',
  'Non-healing neuro-ischemic plantar ulcer with surrounding erythema and purulent drainage',
  'Deep vein thrombosis of the left lower extremity with massive swelling and tension (Phlegmasia alba)',
];

export const COMMON_DURATIONS = [
  'Under 6 hours (Hyperacute / Emergency)',
  '6 - 24 hours (Acute)',
  '1 - 3 days (Subacute)',
  '4 - 7 days (1 week)',
  '2 - 4 weeks',
  '1 - 3 months',
  '3 - 6 months',
  'More than 6 months (Chronic)',
];

export const COMMON_ALLERGIES = [
  'Nil known drug allergies (NKDA)',
  'Penicillin / Beta-lactams (anaphylaxis)',
  'Iodinated radiocontrast media',
  'Latex',
  'Aspirin / NSAIDs',
  'Sulfa drugs / Sulfonamides',
  'Heparin (History of HIT Type II)',
  'Morphine / Opioids (nausea/rash)',
];

export const COMMON_MEDICAL_HISTORIES = [
  'Hypertension, Type 2 Diabetes Mellitus (HbA1c 7.9%), Dyslipidemia, 35 pack-year smoking history',
  'Hypertension on ACE inhibitors, Atrial Fibrillation on NOAC, Chronic Kidney Disease Stage 3a',
  'No significant past medical history, non-smoker',
  'Coronary Artery Disease (s/p DES to LAD 2021), Hypercholesterolemia, Ex-smoker',
  'Peripheral Artery Disease, Hypertension, Chronic Obstructive Pulmonary Disease (GOLD II)',
  'Type 2 Diabetes Mellitus on insulin, Diabetic peripheral neuropathy, Obesity (BMI 32)',
];

export const COMMON_SURGICAL_HISTORIES = [
  'No prior surgical procedures (virgin abdomen)',
  'Open appendectomy in childhood (uneventful)',
  'Previous laparoscopic cholecystectomy (2018), uneventful recovery',
  'Prior bilateral inguinal hernia repair with polypropylene mesh (2015)',
  'Percutaneous transluminal angioplasty (PTA) of right SFA (2022)',
  'Coronary Artery Bypass Graft (CABG x3) in 2019',
];

export const COMMON_GENERAL_EXAMS = [
  'Conscious, alert, oriented x3, resting in bed holding affected limb downwards, visibly in mild pain',
  'Alert, febrile (38.4°C), flushed facies, lying still in bed with legs slightly flexed due to peritoneal irritation',
  'Hemodynamically stable, calm, no acute cardiorespiratory distress, normal nutritional status',
  'Elderly patient, pale conjunctivae, dehydrated mucous membranes, resting quietly in supine position',
  'Anxious, diaphoresis, tachypneic due to severe pain in the affected lower limb',
];

export const COMMON_VITALS = [
  'BP: 138/82 mmHg, HR: 76 bpm regular, RR: 16/min, Temp: 36.8°C, SpO2: 98% room air',
  'BP: 125/75 mmHg, HR: 98 bpm regular, RR: 19/min, Temp: 38.3°C, SpO2: 97% room air',
  'BP: 155/90 mmHg, HR: 82 bpm regular, RR: 15/min, Temp: 37.0°C, SpO2: 99% room air',
  'BP: 110/70 mmHg, HR: 88 bpm regular, RR: 18/min, Temp: 37.2°C, SpO2: 98% room air',
  'BP: 165/95 mmHg, HR: 104 bpm sinus, RR: 22/min, Temp: 37.4°C, SpO2: 96% room air',
];

export const COMMON_ABDOMINAL_EXAMS = [
  'Soft, non-distended, localized guarding and marked tenderness at McBurney point, positive Rovsing and Psoas signs, normal bowel sounds',
  'Soft, non-tender throughout, no palpable pulsatile mass, no organomegaly, active bowel sounds',
  'Pulsatile expansile midline epigastric mass measuring approx. 6 cm, non-tender, no femoral or abdominal bruits',
  'Distended abdomen, generalized tenderness with involuntary muscular guarding and rigidity, absent bowel sounds',
  'Tenderness and voluntary guarding in right hypochondrium, positive Murphy sign, no rebound tenderness',
  'Soft, bilateral symmetrical groin inspection reveals reducible right indirect inguinal hernia, no strangulation signs',
];

export const COMMON_LOCAL_EXAMS = [
  'Right foot pale with dependent rubor; capillary refill >4 sec; absent dorsalis pedis and posterior tibial pulses; 1.5 cm dry necrotic eschar on tip of right hallux; sensory hypoesthesia',
  'Right lower quadrant abdominal wall localized rebound tenderness; incision sites from previous surgery well-healed',
  'Neurological exam intact; no carotid bruit audible over cervical bifurcation; symmetrical upper extremity pulses',
  'Left lower leg diffuse pitting edema to mid-calf; calf tenderness on compression; positive Homans sign; intact motor and sensation',
  'Left calf: cool skin, mottled cyanosis, absent popliteal and pedal pulses; diminished pinprick sensation over dorsum of foot',
  'Bilateral varicose veins in Great Saphenous Vein distribution (CEAP C4a) with skin pigmentation and stasis dermatitis at medial malleolus',
];

export const COMMON_PRIMARY_DIAGNOSES = [
  'Peripheral Arterial Occlusive Disease (PAOD Fontaine Stage IV / Rutherford Category 5)',
  'Acute Appendicitis with Localized Fibrinous-Purulent Peritonitis',
  'Symptomatic Internal Carotid Artery Stenosis (>70% NASCET criteria)',
  'Infrarenal Abdominal Aortic Aneurysm (AAA, maximal diameter 5.8 cm)',
  'Acute Calculous Cholecystitis with Gallbladder Hydrops',
  'Right Incarcerated Inguinal Hernia (Nyhus Type IIIb)',
  'Acute Arterial Embolic Occlusion of the Right Common Femoral Artery',
  'Chronic Venous Insufficiency (CEAP C4b with lipodermatosclerosis)',
  'Small Bowel Mechanical Obstruction secondary to Postoperative Bands / Adhesions',
  'Diabetic Foot Syndrome with Deep Plantar Abscess and Phlegmon (Wagner Grade 3)',
];

export const COMMON_SECONDARY_DIAGNOSES = [
  'Essential Arterial Hypertension, Type 2 Diabetes Mellitus, Hyperlipidemia',
  'Coronary Artery Disease, Paroxysmal Atrial Fibrillation, Chronic Kidney Disease Stage 3',
  'Obesity (BMI 31.4 kg/m²), Chronic Obstructive Pulmonary Disease',
  'Active Tobacco Abuse (35 pack-years), Peripheral Neuropathy',
  'Mild normocytic anemia, Hypokalemia (mild)',
  'None documented',
];

export const COMMON_DIFFERENTIAL_DIAGNOSES = [
  'Diabetic neuro-ischemic ulceration, Peripheral thromboangiitis obliterans (Buerger disease), Microembolization syndrome',
  'Acute mesenteric adenitis, Meckel diverticulitis, Perforated peptic ulcer, Right acute pyelonephritis',
  'Transient ischemic attack secondary to cardiac embolism, Migraine with aura, Focal epileptic seizure',
  'Expanding symptomatic aortoiliac ectasia, Retroperitoneal neoplasm, Spondylodiscitis',
  'Acute biliary pancreatitis, Perforated peptic ulcer, Acute hepatitis, Biliary colic',
  'Incarcerated femoral hernia, Lymphadenitis, Lipoma of the cord, Psoas abscess',
];

export const COMMON_PROCEDURE_NAMES = [
  'Femoro-popliteal Bypass (above-knee) with Autologous Reversed Great Saphenous Vein',
  'Laparoscopic Appendectomy with Endoloop Ligation and Endobag Retrieval',
  'Right Carotid Endarterectomy (CEA) with Dacron Patch Angioplasty',
  'Open Repair of Infrarenal Abdominal Aortic Aneurysm with Tube Dacron Graft (20 mm)',
  'Laparoscopic Cholecystectomy with Intraoperative Cholangiography',
  'Open Right Inguinal Hernia Mesh Repair (Lichtenstein Technique)',
  'Emergency Fogarty Balloon Catheter Embolectomy of Right Femoral and Popliteal Arteries',
  'Endovenous Radiofrequency Ablation (RFA) of Great Saphenous Vein with Miniphlebectomies',
  'Exploratory Diagnostic Laparotomy and Adhesiolysis for Bowel Decompression',
  'Incision, Drainage and Radical Debridement of Diabetic Plantar Space Infection',
];

export const COMMON_SURGICAL_APPROACHES = [
  'Medial longitudinal groin incision and supragenicular medial thigh approach with vascular dissection',
  'Standard three-trocar laparoscopic transperitoneal approach (10 mm umbilical, 5 mm suprapubic, 5 mm left lower quadrant)',
  'Cervical longitudinal incision along anterior border of sternocleidomastoid muscle',
  'Standard transperitoneal midline laparotomy from xiphoid to symphysis',
  'Four-trocar laparoscopic French / American technique for subcostal gallbladder dissection',
  'Transverse oblique inguinal incision 2 cm above inguinal ligament (Lichtenstein exposure)',
  'Longitudinal femoral artery cut-down over femoral bifurcation at groin crease',
  'Percutaneous endovenous retrograde cannulation under continuous ultrasound guidance',
];

export const COMMON_ANAESTHESIA_TYPES = [
  'General Endotracheal Anaesthesia (GETA)',
  'Spinal Anaesthesia (Subarachnoid block with Bupivacaine 0.5% heavy)',
  'Epidural Anaesthesia with Continuous Catheter Analgesia',
  'Cervical Plexus Block with Monitored Anesthesia Care (MAC)',
  'Local Infiltration Anaesthesia with Sedation',
  'Combined General and Epidural Anaesthesia',
  'Femoral and Sciatic Nerve Peripheral Block',
];

export const COMMON_OPERATIVE_FINDINGS = [
  'Total thrombotic occlusion of proximal superficial femoral artery (SFA) with patent popliteal artery P1 segment; good autologous vein caliber (4.5 mm); brisk inflow from common femoral artery',
  'Retrocecal gangrenous appendix with fibrinous exudate, appendicolith impacted at base, minimal cloudy peritoneal fluid in pouch of Douglas; healthy cecal base',
  'Ulcerated, calcified atheromatous plaque extending from common carotid bifurcation into internal carotid artery with 85% luminal compromise; back-bleeding adequate',
  'Fusiform infrarenal aortic aneurysm measuring 5.8 cm maximal diameter; neck length 25 mm with minimal mural thrombus; iliac arteries non-aneurysmal',
  'Distended tense gallbladder with severely inflamed, thickened wall (5 mm), impacted stone in Hartmann pouch; cystic duct and artery identified clearly in triangle of Calot',
  'Direct defect in transversalis fascia at Hesselbach triangle with preperitoneal fat herniation, internal ring snug',
];

export const COMMON_OPERATIVE_OUTCOMES = [
  'Uneventful procedure, strong palpable distal peripheral pulses restored immediately, blood loss <100 mL',
  'Uneventful complete laparoscopic resection, intact specimen retrieved in Endobag, hemostasis verified',
  'Uneventful patch reconstruction, no neurological deficit upon awake extubation in theatre',
  'Smooth cross-clamp release, hemodynamics stable, good peripheral capillary refill maintained',
  'Uneventful removal without bile duct injury or spillage, ports closed securely in layers',
  'Complete tension-free polypropylene mesh repair, no nerve entrapment, skin closed intradermally',
];

export const COMMON_WOUND_STATUSES = [
  'Clean, dry, edges well-approximated per primam intentionem, no erythema, seroma, or hematoma',
  'Trocar port sites clean, dry, dressings intact, mild expected localized peri-incisional ecchymosis',
  'Cervical incision flat, no subcutaneous hematoma, drain removed on POD 1 with <15 mL serosanguinous fluid',
  'Clean granulating wound bed with negative pressure wound therapy (VAC) functioning at -125 mmHg',
  'Minimal serous discharge at lower pole managed conservatively with antiseptic dressing changes',
];

export const COMMON_ACTIVITY_TYPES = [
  'Operating Theatre (Major Surgery)',
  'Operating Theatre (Minor / Ambulatory Surgery)',
  'Surgical Ward Rounds & Inpatient Clinical Care',
  'Emergency Surgical On-Call Duty & Trauma Admissions',
  'Outpatient Surgical Clinic & Follow-Up Consultations',
  'Angiography & Endovascular Suite (Cath Lab)',
  'Surgical Intensive Care Unit (ICU / IMCU) Rounds',
  'Simulation Lab, Wet-Lab & Cadaveric Dissection Training',
];

export const COMMON_PARTICIPATION_ROLES = [
  'Observer',
  'Assisted',
  'First Assistant',
  'Second Assistant',
  'Scrubbed and Assisted',
  'Performed Specific Steps Under Direct Supervision',
  'Performed Under Supervision',
];

export const COMMON_SUPERVISION_LEVELS = [
  'Direct Supervision (Supervisor scrubbed at table)',
  'Indirect Supervision (Supervisor in theatre / readily available)',
  'Observational (Supervisor leading procedure)',
];

export const COMMON_PARTICIPATION_DESCRIPTIONS = [
  'Scrubbed as First Assistant: Assisted with sterile patient draping, maintained surgical exposure using self-retaining and Langenbeck retractors, performed atraumatic vessel mobilization and heparinization, assisted with 6-0 Prolene running vascular anastomoses and final wound closure in anatomical layers.',
  'Assisted as Co-Surgeon: Managed camera navigation during laparoscopy, retracted gallbladder fundus and infundibulum to expose Calot triangle, assisted in identifying cystic duct and artery, suctioned peritoneal fluid, and performed port-site intradermal closures.',
  'Performed Specific Steps Under Direct Supervision: Performed skin incision, dissection through subcutaneous tissue, exposure of femoral sheath, vascular tape isolation around common femoral artery, and continuous subcuticular Monocryl skin closure.',
  'Scrubbed and Assisted: Held vascular clamps, cut Prolene sutures under loupe magnification, flushed graft with heparinized saline, monitored distal Doppler signals before and after clamp release.',
  'First Assistant in emergency intervention: Assisted in rapid inguinal access, Fogarty catheter insertion, extraction of fresh thromboembolic casts, back-bleeding assessment, and longitudinal arteriotomy closure.',
];

export const COMMON_RESPONSIBILITIES = [
  'Maintaining clear operative field visibility, precise suctioning and hemostasis using bipolar electrocautery, vessel isolation with vessel loops, assisting with running parachute anastomoses, needle handling and counting.',
  'Camera navigation with 30-degree laparoscope, counter-traction on operative tissues, clip applicator handling, retrieval bag deployment, desufflation and port site closure.',
  'Sterile field preparation, subcutaneous tissue dissection, retraction, knot tying under tension, wound irrigation, applying sterile dressings.',
  'Preoperative patient positioning, limb antiseptic preparation, systemic heparin administration timing, intraoperative transit-time flow measurement documentation.',
];

export const COMMON_TECHNIQUES_OBSERVED = [
  'End-to-side arterial anastomosis with 6-0 Prolene continuous suture, spatulation of autologous saphenous vein, systemic heparinization and clamp release protocol.',
  'Critical View of Safety (CVS) dissection in Calot triangle, intraoperative cholangiography under fluoroscopy, Endoloop ligature ligation.',
  'Carotid endarterectomy plaque peeling along subadventitial plane, Javid shunt insertion, Dacron patch angioplasty with 6-0 Prolene.',
  'Transabdominal infrarenal aortic cross-clamping, endoaneurysmorrhaphy, lumbar artery oversewing with 3-0 Prolene, tube graft interposition.',
  'Lichtenstein tension-free mesh fixation using running non-absorbable suture to inguinal ligament, preserving ilioinguinal and genital nerves.',
];

export const COMMON_TECHNIQUES_PRACTICED = [
  'Atraumatic vessel dissection and vessel loop isolation, arterial clamp application, passing 6-0 Prolene parachute sutures, one-handed and two-handed deep surgical knot tying, subcuticular skin closure.',
  'Two-handed instrument laparoscopic coordination, tissue grasping, electrocautery hook dissection, Endoloop cinching, fascia closure with port-closure needle.',
  'Subcutaneous tissue separation, vessel tape looping around femoral bifurcation branches, surgical knot tying under tension, staple application.',
  'Fogarty catheter inflation to measured resistance, gentle catheter withdrawal, arteriotomy closure with running vascular sutures.',
  'Dissection of external oblique aponeurosis, isolation of spermatic cord, positioning and tacking of synthetic mesh.',
];

export const COMMON_LEARNING_POINTS = [
  'Appreciated the critical importance of tension-free vascular anastomoses, proper vein spatulation to avoid constriction, and sequential de-airing and flushing prior to restoration of arterial flow.',
  'Recognized the anatomical landmarks for the Critical View of Safety (CVS) to prevent iatrogenic bile duct injury; refined camera orientation technique.',
  'Learned the tactical handling of atherosclerotic plaques to avoid intimal flap disruption and distal embolization; mastered gentle suture tension management.',
  'Understood hemodynamics during aortic cross-clamp application and the necessity of gradual unclamping to avoid declamping hypotension.',
  'Understood the course of the ilioinguinal nerve to prevent chronic post-herniorrhaphy groin neuralgia; refined mesh overlap margins.',
];

export const COMMON_SUPERVISOR_FEEDBACK = [
  'Demonstrated sound sterile discipline and excellent tissue handling. Good manual dexterity during vessel isolation and assisted knot tying. Ready to progress to performing arteriotomy under direct supervision.',
  'Smooth instrument coordination and attentive camera navigation. Well-prepared on surgical anatomy. Good proactive assistance throughout critical dissection phases.',
  'Accurate understanding of operative steps and anatomical planes. Reliable hemostasis maintenance. Commended for diligent post-procedure patient follow-up.',
  'Very steady hands and precise needle angles during vascular exposure. Maintained focused concentration throughout the 4-hour complex reconstruction.',
];

export const SKILL_CATEGORIES = [
  'Sterile Field & Basics',
  'Tissue Handling',
  'Instrumentation',
  'Wound Closure',
  'Wound Management',
  'Operative Procedures',
  'Clinical Assessment',
  'Non-Invasive Diagnostics',
  'Access & Cannulation',
  'Operative Dissection',
  'Vascular Control',
  'Vascular Reconstruction',
  'Graft Preparation',
  'Bypass Surgery',
  'Emergency Interventions',
  'Endovascular',
];

// ==========================================
// EXEMPLARY COMPLETE MODEL CASES (READY TO LOAD)
// ==========================================

export const SAMPLE_VASCULAR_CLINICAL_CASE = {
  patientAge: 68,
  patientSex: 'Male' as const,
  presentationDate: new Date().toISOString().substring(0, 10),
  hospital: 'Charité - Universitätsmedizin Berlin',
  department: 'Department of Vascular & Endovascular Surgery',
  specialty: 'Vascular Surgery',
  chiefComplaint: 'Severe lower limb rest pain and ischemic dry necrosis of the first toe (Fontaine IV)',
  historyOfPresentIllness: '68-year-old male with known peripheral arterial disease presents with severe, burning pain in his right foot, predominantly at night and requiring him to hang the limb over the edge of the bed for relief. For the past 3 weeks, he noticed dark dry discoloration of the right big toe tip. No systemic fever or chills.',
  durationOfSymptoms: '3 - 6 months',
  relevantMedicalHistory: 'Hypertension, Type 2 Diabetes Mellitus (HbA1c 7.9%), Dyslipidemia, 35 pack-year smoking history',
  surgicalHistory: 'Percutaneous transluminal angioplasty (PTA) of right SFA (2022)',
  drugHistory: 'Aspirin 100 mg OD, Atorvastatin 40 mg OD, Metformin 1000 mg BD, Ramipril 5 mg OD',
  allergies: 'Nil known drug allergies (NKDA)',
  familyHistory: 'Father deceased from myocardial infarction at age 62',
  socialHistory: 'Retired carpenter, 35 pack-year tobacco use, quit 1 month ago',
  examination: {
    general: 'Conscious, alert, resting in bed holding affected limb downwards, visibly in mild pain',
    vitals: 'BP: 138/82 mmHg, HR: 76 bpm regular, RR: 16/min, Temp: 36.8°C, SpO2: 98% room air',
    cardiovascular: 'S1 + S2 regular, no murmurs, no carotid bruits',
    respiratory: 'Bilateral vesicular breathing, clear lung fields',
    abdominal: 'Soft, non-tender throughout, no palpable pulsatile mass, active bowel sounds',
    neurological: 'Alert, oriented, intact cranial nerves, reduced stocking vibration sense',
    local: 'Right foot pale with dependent rubor; capillary refill >4 sec; absent dorsalis pedis and posterior tibial pulses; 1.5 cm dry necrotic eschar on tip of right hallux; sensory hypoesthesia',
    other: 'Left lower extremity pulses palpable, ABI 0.85',
  },
  investigations: [
    {
      name: 'CBC (Complete Blood Count)',
      category: 'Laboratory',
      date: new Date().toISOString().substring(0, 10),
      result: 'Hb 12.9 g/dL, WBC 8.4 x10^9/L, Plt 240 x10^9/L',
      summary: 'Normal blood count, no leukocytosis',
    },
    {
      name: 'Urea and Creatinine (Renal Function)',
      category: 'Laboratory',
      date: new Date().toISOString().substring(0, 10),
      result: 'Creatinine 1.05 mg/dL, eGFR 74 mL/min/1.73m2, Urea 36 mg/dL',
      summary: 'Preserved renal function suitable for iodinated contrast',
    },
    {
      name: 'Doppler Ultrasound (Duplex Carotid / Peripheral)',
      category: 'Imaging',
      date: new Date().toISOString().substring(0, 10),
      result: 'Monophasic flow in right popliteal, absent pedal signals, right ABI 0.32',
      summary: 'Severe multilevel peripheral arterial occlusive disease',
    },
    {
      name: 'CT Angiography (CTA Head / Chest / Abdomen / Lower Limbs)',
      category: 'Imaging',
      date: new Date().toISOString().substring(0, 10),
      result: 'Complete occlusion of right SFA from origin to distal thigh (TASC II D). Popliteal artery patent (P1-P2) via collateral circulation. Great saphenous vein caliber 4.2 mm.',
      summary: 'Operable target: Supragenicular femoro-popliteal bypass',
    },
  ],
  primaryDiagnosis: 'Peripheral Arterial Occlusive Disease (PAOD Fontaine Stage IV / Rutherford Category 5)',
  secondaryDiagnoses: 'Essential Arterial Hypertension, Type 2 Diabetes Mellitus, Hyperlipidemia',
  differentialDiagnosis: 'Diabetic neuro-ischemic ulceration, Peripheral thromboangiitis obliterans (Buerger disease), Microembolization syndrome',
  icd10Code: 'I70.24',
  clinicalAssessment: 'Chronic limb-threatening ischemia (CLTI) with non-healing dry gangrene and rest pain. Due to extensive long-segment occlusion of the SFA (TASC II D) and good vein conduit, open surgical femoro-popliteal bypass is the gold-standard recommendation.',
  management: {
    initial: 'Bed rest, limb dependency, optimized analgesia (WHO Step 2), intravenous hydration, protective dry dressing.',
    medical: 'Dual antiplatelet therapy considered post-procedure, strict statin therapy, glycemic control with sliding scale insulin.',
    surgical: 'Elective supragenicular femoro-popliteal bypass with reversed autologous great saphenous vein.',
    treatmentPlan: 'Preoperative cardiac clearance, vein mapping ultrasound, open bypass under general anaesthesia, postoperative surveillance.',
    outcome: 'Uneventful recovery with complete resolution of rest pain and warm, well-perfused right foot with palpable pedal pulse.',
    complications: 'None. Wound healed primarily without hematoma or surgical site infection.',
  },
  surgicalProcedure: {
    procedureName: 'Femoro-popliteal Bypass (above-knee) with Autologous Reversed Great Saphenous Vein',
    procedureDate: new Date().toISOString().substring(0, 10),
    specialty: 'Vascular Surgery',
    indication: 'Chronic limb-threatening ischemia (PAOD Fontaine IV) with long-segment SFA occlusion',
    surgicalApproach: 'Medial longitudinal groin incision and supragenicular medial thigh approach with vascular dissection',
    operativeFindings: 'Total thrombotic occlusion of proximal superficial femoral artery (SFA) with patent popliteal artery P1 segment; good autologous vein caliber (4.5 mm); brisk inflow from common femoral artery',
    procedureSummary: '1. Groin exploration: Common, superficial, and deep femoral arteries dissected and encircled with vessel loops. 2. Great saphenous vein harvested via interrupted medial thigh incisions, hydrostatically gently distended, side branches ligated with 4-0 silk. 3. Supragenicular popliteal artery exposed above the knee. 4. Heparin 5000 IU IV administered. 5. Proximal end-to-side anastomosis to CFA using running 6-0 Prolene. 6. Graft tunneled anatomically subsartorial. 7. Distal end-to-side anastomosis to P1 popliteal artery using running 6-0 Prolene. 8. Clamps released, graft pulsating vigorously, strong palpable posterior tibial pulse restored immediately. Hemostasis secured, layered closure.',
    anaesthesiaType: 'General Endotracheal Anaesthesia (GETA)',
    outcome: 'Uneventful procedure, strong palpable distal peripheral pulses restored immediately, blood loss <100 mL',
    participationRole: 'First Assistant' as const,
  },
  followUp: {
    followUpDate: new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10),
    woundStatus: 'Clean, dry, edges well-approximated per primam intentionem, no erythema, seroma, or hematoma',
    clinicalProgress: 'Patient fully mobilized on postoperative day 1 with complete cessation of rest pain. Postoperative ABI improved from 0.32 to 0.94 with palpable posterior tibial and dorsalis pedis pulses. Big toe dry eschar demarcation stable, planned for minor podiatric debridement.',
  },
};

export const SAMPLE_GENERAL_SURGERY_CLINICAL_CASE = {
  patientAge: 27,
  patientSex: 'Female' as const,
  presentationDate: new Date().toISOString().substring(0, 10),
  hospital: 'Universitätsklinikum Heidelberg',
  department: 'Department of General, Visceral & Transplant Surgery',
  specialty: 'General Surgery',
  chiefComplaint: 'Acute right lower quadrant abdominal pain with tenderness and vomiting for 24 hours',
  historyOfPresentIllness: '27-year-old previously healthy female presents to emergency room with peri-umbilical colicky pain that migrated to the right iliac fossa over 18 hours. Accompanied by anorexia, two episodes of bilious vomiting, and low-grade pyrexia. Last menstrual period 2 weeks ago.',
  durationOfSymptoms: '6 - 24 hours (Acute)',
  relevantMedicalHistory: 'No significant past medical history, non-smoker',
  surgicalHistory: 'No prior surgical procedures (virgin abdomen)',
  drugHistory: 'None regular. Took Paracetamol 1000 mg with minimal relief.',
  allergies: 'Nil known drug allergies (NKDA)',
  familyHistory: 'Non-contributory',
  socialHistory: 'Graduate student, non-smoker, occasional alcohol',
  examination: {
    general: 'Alert, febrile (38.3°C), flushed facies, lying still in bed with legs slightly flexed due to peritoneal irritation',
    vitals: 'BP: 125/75 mmHg, HR: 98 bpm regular, RR: 19/min, Temp: 38.3°C, SpO2: 97% room air',
    cardiovascular: 'Tachycardia 98 bpm, S1 + S2 clear',
    respiratory: 'Clear breath sounds bilaterally',
    abdominal: 'Soft, non-distended, localized guarding and marked tenderness at McBurney point, positive Rovsing and Psoas signs, normal bowel sounds',
    neurological: 'Intact, GCS 15/15',
    local: 'Right lower quadrant abdominal wall localized rebound tenderness; incision sites from previous surgery well-healed',
    other: 'Pelvic examination: cervical motion tenderness absent, beta-hCG negative',
  },
  investigations: [
    {
      name: 'CBC (Complete Blood Count)',
      category: 'Laboratory',
      date: new Date().toISOString().substring(0, 10),
      result: 'WBC 14.8 x10^9/L (86% neutrophils), Hb 13.4 g/dL, Plt 260 x10^9/L',
      summary: 'Marked neutrophilic leukocytosis consistent with acute infection',
    },
    {
      name: 'CRP (C-Reactive Protein)',
      category: 'Laboratory',
      date: new Date().toISOString().substring(0, 10),
      result: 'CRP 58 mg/L (Normal < 5 mg/L)',
      summary: 'Significantly elevated inflammatory marker',
    },
    {
      name: 'Ultrasound (Abdominal / Soft Tissue)',
      category: 'Imaging',
      date: new Date().toISOString().substring(0, 10),
      result: 'Non-compressible, blind-ending tubular structure in RIF measuring 8.5 mm outer diameter, surrounding hyperechoic inflamed mesenteric fat, minimal free fluid',
      summary: 'Sonographic findings diagnostic of acute appendicitis',
    },
  ],
  primaryDiagnosis: 'Acute Appendicitis with Localized Fibrinous-Purulent Peritonitis',
  secondaryDiagnoses: 'None documented',
  differentialDiagnosis: 'Acute mesenteric adenitis, Meckel diverticulitis, Perforated peptic ulcer, Right acute pyelonephritis',
  icd10Code: 'K35.80',
  clinicalAssessment: 'Alvarado Score = 9/10 (High probability). Clinical and ultrasonographic diagnosis of acute appendicitis indicated for urgent laparoscopic intervention.',
  management: {
    initial: 'NPO, IV crystalloids (Ringer Lactate 1000 mL), IV Paracetamol 1g, single-dose preoperative antibiotic prophylaxis (Cefuroxime 1.5g + Metronidazole 500mg IV).',
    medical: 'Postoperative oral analgesia, resumption of clear fluids 4 hours post-op.',
    surgical: 'Emergency diagnostic laparoscopy and laparoscopic appendectomy.',
    treatmentPlan: 'Diagnostic laparoscopy, identification and skeletonization of appendix, base ligation with Endoloops, removal via Endobag.',
    outcome: 'Complete resolution of abdominal pain, discharge on postoperative day 1.',
    complications: 'None. Clean healing of trocar sites.',
  },
  surgicalProcedure: {
    procedureName: 'Laparoscopic Appendectomy with Endoloop Ligation and Endobag Retrieval',
    procedureDate: new Date().toISOString().substring(0, 10),
    specialty: 'General Surgery',
    indication: 'Acute phlegmonous-gangrenous appendicitis with localized peritonitis',
    surgicalApproach: 'Standard three-trocar laparoscopic transperitoneal approach (10 mm umbilical, 5 mm suprapubic, 5 mm left lower quadrant)',
    operativeFindings: 'Retrocecal gangrenous appendix with fibrinous exudate, appendicolith impacted at base, minimal cloudy peritoneal fluid in pouch of Douglas; healthy cecal base',
    procedureSummary: '1. Pneumoperitoneum established via infraumbilical Hasson open cut-down (12 mmHg CO2). 2. Diagnostic laparoscopy excluded gynecological pathology and Meckel diverticulum. 3. Mesoappendix skeletonized using bipolar electrocautery; appendicular artery coagulated and divided. 4. Appendix base doubly ligated with two PDS Endoloops and transected. 5. Specimen placed into Endobag and extracted via umbilical port. 6. Pelvis aspirated and irrigated with warm saline. 7. Fascia closed with 0 Vicryl, skin closed with 4-0 Monocryl subcuticular.',
    anaesthesiaType: 'General Endotracheal Anaesthesia (GETA)',
    outcome: 'Uneventful complete laparoscopic resection, intact specimen retrieved in Endobag, hemostasis verified',
    participationRole: 'Performed Specific Steps Under Direct Supervision' as const,
  },
  followUp: {
    followUpDate: new Date(Date.now() + 10 * 86400000).toISOString().substring(0, 10),
    woundStatus: 'Trocar port sites clean, dry, dressings intact, mild expected localized peri-incisional ecchymosis',
    clinicalProgress: 'Patient was ambulatory 4 hours postoperatively, tolerated soft diet in evening, discharged next morning afebrile with normal inflammatory markers. Histology confirmed acute gangrenous appendicitis with clear resection margins.',
  },
};

export const SAMPLE_TRAINING_RECORD_DATA = {
  trainingDate: new Date().toISOString().substring(0, 10),
  procedureDate: new Date().toISOString().substring(0, 10),
  hospital: 'Charité - Universitätsmedizin Berlin',
  department: 'Department of Vascular & Endovascular Surgery',
  specialty: 'Vascular Surgery',
  activityType: 'Operating Theatre (Major Surgery)',
  procedureName: 'Femoro-popliteal Bypass (above-knee) with Autologous Reversed Great Saphenous Vein',
  startTime: '08:00',
  endTime: '13:00',
  breakDurationMinutes: 30,
  netTrainingHours: 4.5,
  participationRole: 'First Assistant' as const,
  supervisionLevel: 'Direct Supervision (Supervisor scrubbed at table)' as const,
  descriptionOfParticipation: 'Scrubbed as First Assistant: Assisted with sterile patient draping, maintained surgical exposure using self-retaining and Langenbeck retractors, performed atraumatic vessel mobilization and heparinization, assisted with 6-0 Prolene running vascular anastomoses and final wound closure in anatomical layers.',
  responsibilities: 'Maintaining clear operative field visibility, precise suctioning and hemostasis using bipolar electrocautery, vessel isolation with vessel loops, assisting with running parachute anastomoses, needle handling and counting.',
  surgicalTechniquesObserved: 'End-to-side arterial anastomosis with 6-0 Prolene continuous suture, spatulation of autologous saphenous vein, systemic heparinization and clamp release protocol.',
  surgicalTechniquesPracticed: 'Atraumatic vessel dissection and vessel loop isolation, arterial clamp application, passing 6-0 Prolene parachute sutures, one-handed and two-handed deep surgical knot tying, subcuticular skin closure.',
  skillsAcquired: [
    'Vessel Exposure',
    'Arterial Dissection',
    'Vascular Clamping',
    'Arteriotomy',
    'Vascular Suturing',
    'Arterial Anastomosis',
    'Vein Harvesting',
    'Skin Closure',
  ],
  learningPoints: 'Appreciated the critical importance of tension-free vascular anastomoses, proper vein spatulation to avoid constriction, and sequential de-airing and flushing prior to restoration of arterial flow.',
  supervisorFeedback: 'Demonstrated sound sterile discipline and excellent tissue handling. Good manual dexterity during vessel isolation and assisted knot tying. Ready to progress to performing arteriotomy under direct supervision.',
  additionalNotes: 'Patient transferred to PACU with strong palpable pedal pulses.',
  verified: true,
};

export const SAMPLE_SKILL_PRESET_ITEMS = [
  {
    name: 'Arterial Anastomosis',
    nameGerman: 'Anlage einer arteriellen Anastomose (End-zu-Seit)',
    specialty: 'Vascular Surgery',
    category: 'Vascular Reconstruction',
    exposureLevel: 'Performed Under Supervision' as const,
    competencyStatus: 'Competent' as const,
    totalRecordedSessions: 14,
    totalDocumentedHours: 42,
    feedbackNotes: 'Consistently displays precise bite placement, suture spacing (1-1.5 mm), and reliable intima apposition.',
  },
  {
    name: 'Vessel Exposure',
    nameGerman: 'Freilegung von Blutgefäßen (A. femoralis, carotis)',
    specialty: 'Vascular Surgery',
    category: 'Operative Dissection',
    exposureLevel: 'Performed Under Supervision' as const,
    competencyStatus: 'Mastered' as const,
    totalRecordedSessions: 22,
    totalDocumentedHours: 58,
    feedbackNotes: 'Safe dissection plane identification along anatomical vascular sheaths without iatrogenic nerve injury.',
  },
  {
    name: 'Vascular Suturing',
    nameGerman: 'Gefäßnaht (fortlaufend mit Prolene)',
    specialty: 'Vascular Surgery',
    category: 'Vascular Reconstruction',
    exposureLevel: 'Performed Under Supervision' as const,
    competencyStatus: 'Competent' as const,
    totalRecordedSessions: 18,
    totalDocumentedHours: 48,
    feedbackNotes: 'Demonstrates excellent needle angle control and steady parachute tensioning using 5-0 and 6-0 monofilament.',
  },
  {
    name: 'Skin Closure',
    nameGerman: 'Hautverschluss (Einzelknopf, Intrakutan, Klammern)',
    specialty: 'General Surgery',
    category: 'Wound Closure',
    exposureLevel: 'Performed Independently' as const,
    competencyStatus: 'Mastered' as const,
    totalRecordedSessions: 35,
    totalDocumentedHours: 70,
    feedbackNotes: 'Aesthetic intradermal closures with Monocryl, meticulous edge eversion and minimal scar tension.',
  },
  {
    name: 'Vein Harvesting',
    nameGerman: 'Venenentnahme (V. saphena magna für Bypass)',
    specialty: 'Vascular Surgery',
    category: 'Graft Preparation',
    exposureLevel: 'Assisted' as const,
    competencyStatus: 'Learning' as const,
    totalRecordedSessions: 8,
    totalDocumentedHours: 24,
    feedbackNotes: 'Gently skeletonizes vein branches and handles endothelium with care. Improving branch ligation speed.',
  },
];
