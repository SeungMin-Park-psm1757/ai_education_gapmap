export type SchoolProfile = {
  id: string;
  schoolName: string;
  address?: string;
  schoolLevel?: string;
  district?: string;
  eduOffice?: string;
  phone?: string;
  homepage?: string;
  latitude?: number;
  longitude?: number;
  studentCount?: number;
  classCount?: number;
  teacherCount?: number;
  studentTeacherRatio?: number;
  studentsPerClass?: number;
  facilitySignal?: number;
  digitalInfraSignal?: number;
  aiProgramSignal?: number;
  teacherTrainingSignal?: number;
  regionalSupportSignal?: number;
  generalClassroomCount?: number;
  subjectClassroomCount?: number;
  learningSupportRoomCount?: number;
  studentWelfareRoomCount?: number;
  restroomCount?: number;
  careerCounselRoomCount?: number;
  broadcastCapacity?: number;
  clubCount?: number;
  clubStudentCount?: number;
  clubTeacherCount?: number;
  clubExternalInstructorCount?: number;
  studentSelectedClubCount?: number;
  creativeActivityBudget?: number;
  afterSchoolProgramCount?: number;
  afterSchoolStudentCount?: number;
  currentAfterSchoolProgramCount?: number;
  currentAfterSchoolStudentCount?: number;
  vacationAfterSchoolProgramCount?: number;
  vacationAfterSchoolStudentCount?: number;
  schoolInfoApiTypes?: string[];
  dataSourceNote?: string;
  publicSupplementSource?: string;
};

export type ReadinessScore = {
  schoolId: string;
  schoolName: string;
  score: number;
  level: "high" | "medium" | "attention" | "field_check";
  type: string;
  signals: string[];
  weakFactors: string[];
  recommendedSupports: string[];
  dataReliability?: {
    grade: "A" | "B" | "C";
    label: string;
    missingCoreCount: number;
    directFieldCount: number;
    proxyFieldCount: number;
  };
  raw: {
    educationDemand: number;
    teacherOperation: number;
    digitalAccess: number;
    aiLearningOpportunity: number;
    regionalAccess: number;
  };
};

export type SupportPackage = {
  type: string;
  title: string;
  description: string;
  actions: string[];
};

export type DataManifest = {
  generatedAt?: string;
  targetSido?: string;
  targetDistrict?: string;
  warnings?: string[];
  counts?: Record<string, number>;
};
