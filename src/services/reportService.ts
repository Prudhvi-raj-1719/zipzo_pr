import api from './api';

export interface ReportData {
  rideId: string;
  reason: string;
  description: string;
  type: 'safety' | 'service' | 'payment' | 'other';
  evidence?: File[];
}

export interface Report {
  id: string;
  userId: string;
  rideId: string;
  reason: string;
  description: string;
  type: string;
  status: 'pending' | 'investigating' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  evidence?: string[];
}

export interface ReportResponse {
  success: boolean;
  message: string;
  report?: Report;
  reports?: Report[];
}

class ReportService {
  async createReport(data: ReportData): Promise<ReportResponse> {
    const formData = new FormData();
    formData.append('rideId', data.rideId);
    formData.append('reason', data.reason);
    formData.append('description', data.description);
    formData.append('type', data.type);
    
    if (data.evidence) {
      data.evidence.forEach((file, index) => {
        formData.append(`evidence`, file);
      });
    }

    const response = await api.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getReports(): Promise<ReportResponse> {
    const response = await api.get('/reports');
    return response.data;
  }

  async getReportById(reportId: string): Promise<ReportResponse> {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  }

  async updateReport(reportId: string, updates: Partial<Report>): Promise<ReportResponse> {
    const response = await api.put(`/reports/${reportId}`, updates);
    return response.data;
  }

  async deleteReport(reportId: string): Promise<ReportResponse> {
    const response = await api.delete(`/reports/${reportId}`);
    return response.data;
  }

  // Admin methods
  async getAllReports(): Promise<ReportResponse> {
    const response = await api.get('/reports/all');
    return response.data;
  }

  async updateReportStatus(reportId: string, status: Report['status']): Promise<ReportResponse> {
    const response = await api.put(`/reports/${reportId}/status`, { status });
    return response.data;
  }
}

export default new ReportService(); 