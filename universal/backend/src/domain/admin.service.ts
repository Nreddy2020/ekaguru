import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    async getAllSubjects() {
        // Mock Data
        return [
            { id: '1', name: 'OpenShift', status: 'PUBLISHED', version: '1.2.0' },
            { id: '2', name: 'Quantum Physics', status: 'DRAFT', version: '0.9.0' },
            { id: '3', name: 'Rust Lang', status: 'REVIEW', version: '1.0.0' },
        ];
    }

    async publishSubject(id: string) {
        this.logger.log(`Publishing Subject ${id}...`);
        // Logic: Update DB status to PUBLISHED
        return { success: true, status: 'PUBLISHED' };
    }

    async deprecateSubject(id: string) {
        this.logger.log(`Deprecating Subject ${id}...`);
        // Logic: Update DB status to DEPRECATED
        return { success: true, status: 'DEPRECATED' };
    }
}
