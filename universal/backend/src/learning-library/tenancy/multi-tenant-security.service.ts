import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MultiTenantSchoolService, TeacherRecord, StudentRecord, SectionRecord } from './multi-tenant-school.service';

export interface TenantContext {
  districtId: string;
  schoolId: string;
  callerId: string;
  role: 'DISTRICT_ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STUDENT';
}

@Injectable()
export class MultiTenantSecurityService {
  private readonly logger = new Logger(MultiTenantSecurityService.name);

  constructor(private readonly schoolService: MultiTenantSchoolService) {}

  // Zero-Leakage Tenant Boundary Enforcer:
  // If a resource belongs to a different school or district, throws NotFoundException (or Forbidden)
  // to avoid leaking resource existence across tenant boundaries.
  public validateStudentAccess(context: TenantContext, targetStudentId: string): StudentRecord {
    const student = this.schoolService.getStudent(targetStudentId);

    // Zero-Leakage: If student does not exist OR belongs to a different school, return 404 NOT FOUND
    if (!student || student.schoolId !== context.schoolId || student.districtId !== context.districtId) {
      this.logger.warn(
        `[TENANT SECURITY ALARM] Cross-tenant student access attempt blocked. Caller ${context.callerId} (School: ${context.schoolId}) -> Target ${targetStudentId}`
      );
      throw new NotFoundException(`Student '${targetStudentId}' not found in school '${context.schoolId}'`);
    }

    // Role-specific check: A student can only view their own profile
    if (context.role === 'STUDENT' && context.callerId !== targetStudentId) {
      throw new ForbiddenException('Students can only access their own educational profile');
    }

    return student;
  }

  public validateSectionAccess(context: TenantContext, targetSectionId: string): SectionRecord {
    const section = this.schoolService.getSection(targetSectionId);

    if (!section || section.schoolId !== context.schoolId || section.districtId !== context.districtId) {
      this.logger.warn(
        `[TENANT SECURITY ALARM] Cross-tenant section access attempt blocked. Caller ${context.callerId} -> Target Section ${targetSectionId}`
      );
      throw new NotFoundException(`Section '${targetSectionId}' not found in school '${context.schoolId}'`);
    }

    if (context.role === 'TEACHER') {
      const teacher = this.schoolService.getTeacher(context.callerId);
      if (!teacher || !teacher.assignedSectionIds.includes(targetSectionId)) {
        throw new ForbiddenException(`Teacher '${context.callerId}' is not assigned to section '${targetSectionId}'`);
      }
    }

    return section;
  }
}
