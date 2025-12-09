
import { ApiResponse, Course, CourseProgress, User } from '../types';

// Cấu hình URL của Server (Đổi thành IP máy chủ hoặc URL Vercel/Render của bạn)
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * CLIENT API SERVICE
 * Copy file này vào dự án App riêng của bạn (Mobile/Web React).
 * Sử dụng service này để gọi dữ liệu từ Server thay vì localStorage.
 */
export const ApiService = {
    
    // --- Auth ---
    async login(username: string, password: string): Promise<ApiResponse<User>> {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: 'Connection error' };
        }
    },

    // --- Courses ---
    async getCourses(companyId?: string): Promise<ApiResponse<Course[]>> {
        try {
            const url = new URL(`${API_BASE_URL}/courses`);
            if (companyId) url.searchParams.append('companyId', companyId);
            
            const res = await fetch(url.toString());
            return await res.json();
        } catch (error) {
            return { success: false, error: 'Failed to fetch courses' };
        }
    },

    async getCourseDetail(id: string): Promise<ApiResponse<Course>> {
        try {
            const res = await fetch(`${API_BASE_URL}/courses/${id}`);
            return await res.json();
        } catch (error) {
            return { success: false, error: 'Failed to fetch course detail' };
        }
    },

    // --- Learning Progress ---
    async getProgress(userId: string, courseId: string): Promise<ApiResponse<CourseProgress | null>> {
        try {
            const url = new URL(`${API_BASE_URL}/progress`);
            url.searchParams.append('userId', userId);
            url.searchParams.append('courseId', courseId);
            
            const res = await fetch(url.toString());
            return await res.json();
        } catch (error) {
            return { success: false, error: 'Failed to fetch progress' };
        }
    },

    async updateProgress(userId: string, courseId: string, lessonId: string, score?: number): Promise<ApiResponse<CourseProgress>> {
        try {
            const res = await fetch(`${API_BASE_URL}/progress/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, courseId, lessonId, score })
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: 'Failed to save progress' };
        }
    }
};
