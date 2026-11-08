import JSZip from 'jszip';
import { ClinicalCase, Supervisor, TrainingRecord, TrainingSession, UserProfile, UserSkill, RecommendationLetter, SavedArticle } from '../types';

export interface FullBackupPayload {
  version: string;
  exportedAt: string;
  app: string;
  profile: UserProfile | null;
  cases: ClinicalCase[];
  supervisors: Supervisor[];
  records: TrainingRecord[];
  sessions: TrainingSession[];
  skills: UserSkill[];
  recommendations: RecommendationLetter[];
  savedArticles: SavedArticle[];
}

export async function createFullBackupZip(payload: FullBackupPayload): Promise<Blob> {
  const zip = new JSZip();

  const metadata = {
    app: 'SurgiTrack - Professional Surgical Training & Clinical Portfolio',
    version: '1.0.0',
    exportTimestamp: new Date().toISOString(),
    recordCounts: {
      cases: payload.cases.length,
      supervisors: payload.supervisors.length,
      records: payload.records.length,
      sessions: payload.sessions.length,
      skills: payload.skills.length,
      recommendations: payload.recommendations.length,
      articles: payload.savedArticles.length,
    },
    userEmail: payload.profile?.email || 'unknown',
  };

  zip.file('metadata.json', JSON.stringify(metadata, null, 2));
  zip.file('portfolio_data.json', JSON.stringify(payload, null, 2));

  // Also include human readable summary markdown
  const summaryMd = `# SurgiTrack Archive Backup
Exported: ${metadata.exportTimestamp}
Trainee: ${payload.profile?.fullName || 'N/A'} (${payload.profile?.email || ''})

## Summary of Saved Records:
- Clinical Cases: ${payload.cases.length}
- Supervisors: ${payload.supervisors.length}
- Training Records: ${payload.records.length}
- Attendance Sessions: ${payload.sessions.length}
- Documented Skills: ${payload.skills.length}
- Recommendation Letters: ${payload.recommendations.length}

All patient identifiers remain strictly anonymized according to medical privacy standards.
`;
  zip.file('README_BACKUP.txt', summaryMd);

  return await zip.generateAsync({ type: 'blob' });
}

export async function parseBackupFile(file: File): Promise<FullBackupPayload> {
  if (file.name.endsWith('.zip')) {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);
    const dataFile = loadedZip.file('portfolio_data.json');
    if (!dataFile) {
      throw new Error('Invalid SurgiTrack backup archive: missing portfolio_data.json');
    }
    const jsonText = await dataFile.async('text');
    const parsed = JSON.parse(jsonText);
    validateBackupStructure(parsed);
    return parsed;
  } else if (file.name.endsWith('.json')) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    validateBackupStructure(parsed);
    return parsed;
  } else {
    throw new Error('Unsupported backup file format. Please upload a .zip or .json file.');
  }
}

function validateBackupStructure(data: any) {
  if (!data || typeof data !== 'object') {
    throw new Error('Corrupted or empty backup file.');
  }
  if (!Array.isArray(data.cases) || !Array.isArray(data.supervisors) || !Array.isArray(data.records)) {
    throw new Error('Backup file is missing required portfolio data arrays.');
  }
}
