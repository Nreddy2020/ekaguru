import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';

export interface DistrictRecord {
  districtId: string;
  name: string;
  state: string;
  country: string;
  createdAt: string;
}

export interface SchoolRecord {
  schoolId: string;
  districtId: string;
  name: string;
  boardAffiliation: 'NCERT' | 'CBSE' | 'ICSE' | 'STATE_BOARD';
  address: string;
  createdAt: string;
}

export interface SectionRecord {
  sectionId: string;
  schoolId: string;
  districtId: string;
  gradeLevel: string; // e.g. "Grade 5"
  sectionName: string; // e.g. "Section A"
  academicYear: string;
  assignedTeacherIds: string[];
  enrolledStudentIds: string[];
}

export interface TeacherRecord {
  teacherId: string;
  schoolId: string;
  districtId: string;
  displayName: string;
  email: string;
  assignedSectionIds: string[];
  role: 'TEACHER' | 'HEAD_OF_DEPARTMENT' | 'PRINCIPAL';
}

export interface StudentRecord {
  studentId: string;
  schoolId: string;
  districtId: string;
  sectionId: string;
  displayName: string;
  rollNumber: string;
  enrolledAt: string;
}

@Injectable()
export class MultiTenantSchoolService {
  private readonly logger = new Logger(MultiTenantSchoolService.name);

  private districts: Map<string, DistrictRecord> = new Map();
  private schools: Map<string, SchoolRecord> = new Map();
  private sections: Map<string, SectionRecord> = new Map();
  private teachers: Map<string, TeacherRecord> = new Map();
  private students: Map<string, StudentRecord> = new Map();

  constructor() {
    this.seedDefaultTenancy();
  }

  private seedDefaultTenancy(): void {
    // District: Delhi Public Education District
    const d1: DistrictRecord = {
      districtId: 'dist-delhi-01',
      name: 'Delhi Central District',
      state: 'Delhi',
      country: 'India',
      createdAt: new Date().toISOString(),
    };
    this.districts.set(d1.districtId, d1);

    // School A: Delhi Central Public School
    const sA: SchoolRecord = {
      schoolId: 'school-delhi-dps',
      districtId: d1.districtId,
      name: 'Delhi Central Public School',
      boardAffiliation: 'CBSE',
      address: '12 Connaught Place, New Delhi',
      createdAt: new Date().toISOString(),
    };
    this.schools.set(sA.schoolId, sA);

    // School B: Modern Valley Academy (Isolated Tenant)
    const sB: SchoolRecord = {
      schoolId: 'school-delhi-mva',
      districtId: d1.districtId,
      name: 'Modern Valley Academy',
      boardAffiliation: 'NCERT',
      address: '45 Ring Road, New Delhi',
      createdAt: new Date().toISOString(),
    };
    this.schools.set(sB.schoolId, sB);

    // School A: Grade 5 Section A
    const secA1: SectionRecord = {
      sectionId: 'sec-dps-5a',
      schoolId: sA.schoolId,
      districtId: d1.districtId,
      gradeLevel: 'Grade 5',
      sectionName: '5A',
      academicYear: '2026-2027',
      assignedTeacherIds: ['teacher-sharma-01'],
      enrolledStudentIds: ['student-alice-01', 'student-bob-02'],
    };
    this.sections.set(secA1.sectionId, secA1);

    // School B: Grade 5 Section A (Isolated)
    const secB1: SectionRecord = {
      sectionId: 'sec-mva-5a',
      schoolId: sB.schoolId,
      districtId: d1.districtId,
      gradeLevel: 'Grade 5',
      sectionName: '5A',
      academicYear: '2026-2027',
      assignedTeacherIds: ['teacher-verma-02'],
      enrolledStudentIds: ['student-charlie-03', 'student-david-04'],
    };
    this.sections.set(secB1.sectionId, secB1);

    // Teachers
    this.teachers.set('teacher-sharma-01', {
      teacherId: 'teacher-sharma-01',
      schoolId: sA.schoolId,
      districtId: d1.districtId,
      displayName: 'Mrs. Sharma',
      email: 'sharma@dps.edu.in',
      assignedSectionIds: [secA1.sectionId],
      role: 'TEACHER',
    });

    this.teachers.set('teacher-verma-02', {
      teacherId: 'teacher-verma-02',
      schoolId: sB.schoolId,
      districtId: d1.districtId,
      displayName: 'Mr. Verma',
      email: 'verma@mva.edu.in',
      assignedSectionIds: [secB1.sectionId],
      role: 'TEACHER',
    });

    // Students
    this.students.set('student-alice-01', {
      studentId: 'student-alice-01',
      schoolId: sA.schoolId,
      districtId: d1.districtId,
      sectionId: secA1.sectionId,
      displayName: 'Alice Johnson',
      rollNumber: '5A-01',
      enrolledAt: new Date().toISOString(),
    });

    this.students.set('student-bob-02', {
      studentId: 'student-bob-02',
      schoolId: sA.schoolId,
      districtId: d1.districtId,
      sectionId: secA1.sectionId,
      displayName: 'Bob Smith',
      rollNumber: '5A-02',
      enrolledAt: new Date().toISOString(),
    });

    this.students.set('student-charlie-03', {
      studentId: 'student-charlie-03',
      schoolId: sB.schoolId,
      districtId: d1.districtId,
      sectionId: secB1.sectionId,
      displayName: 'Charlie Davis',
      rollNumber: '5A-01',
      enrolledAt: new Date().toISOString(),
    });

    this.students.set('student-david-04', {
      studentId: 'student-david-04',
      schoolId: sB.schoolId,
      districtId: d1.districtId,
      sectionId: secB1.sectionId,
      displayName: 'David Miller',
      rollNumber: '5A-02',
      enrolledAt: new Date().toISOString(),
    });
  }

  public getSchool(schoolId: string): SchoolRecord | undefined {
    return this.schools.get(schoolId);
  }

  public getSection(sectionId: string): SectionRecord | undefined {
    return this.sections.get(sectionId);
  }

  public getTeacher(teacherId: string): TeacherRecord | undefined {
    return this.teachers.get(teacherId);
  }

  public getStudent(studentId: string): StudentRecord | undefined {
    return this.students.get(studentId);
  }
}
