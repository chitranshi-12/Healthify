const BASE_URL = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

class ApiService {
  private token: string | null = null;
  private onUnauthorizedCallback: (() => void) | null = null;

  constructor() {
    this.token = localStorage.getItem('healthify_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('healthify_token', token);
    } else {
      localStorage.removeItem('healthify_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (
        response.status === 401 &&
        !endpoint.startsWith('/auth/login') &&
        !endpoint.startsWith('/auth/register') &&
        !endpoint.startsWith('/auth/google')
      ) {
        this.setToken(null);
        if (this.onUnauthorizedCallback) {
          this.onUnauthorizedCallback();
        }
      }

      const data = await response.json().catch(() => ({
        success: false,
        message: `HTTP Error ${response.status}`,
      }));

      if (!response.ok && data.success === undefined) {
        data.success = false;
      }

      return data;
    } catch (err: any) {
      console.error(`API request error on ${endpoint}:`, err);
      return {
        success: false,
        message: err?.message || 'Network connection error. Please try again.',
      };
    }
  }

  // Auth endpoints
  async register(body: any) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(body) });
  }

  async login(body: any) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  }

  async googleAuth(body: { email?: string; fullName?: string; credential?: string }) {
    return this.request('/auth/google', { method: 'POST', body: JSON.stringify(body) });
  }

  async logout() {
    const res = await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
    return res;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  }

  async resetPassword(body: any) {
    return this.request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) });
  }

  async changePassword(body: any) {
    return this.request('/auth/change-password', { method: 'POST', body: JSON.stringify(body) });
  }

  async updateName(fullName: string) {
    return this.request('/auth/profile-name', { method: 'PATCH', body: JSON.stringify({ fullName }) });
  }

  async deleteAccount() {
    const res = await this.request('/auth/delete-account', { method: 'DELETE' });
    this.setToken(null);
    return res;
  }

  // Profile
  async getProfile() {
    return this.request('/profile');
  }

  async updateProfile(body: any) {
    return this.request('/profile', { method: 'PUT', body: JSON.stringify(body) });
  }

  async submitOnboarding(body: any) {
    return this.request('/profile/onboarding', { method: 'POST', body: JSON.stringify(body) });
  }

  // Conditions
  async getConditions() {
    return this.request('/conditions');
  }

  async addCondition(conditionName: string, notes?: string) {
    return this.request('/conditions', { method: 'POST', body: JSON.stringify({ conditionName, notes }) });
  }

  async removeCondition(id: number) {
    return this.request(`/conditions/${id}`, { method: 'DELETE' });
  }

  // Medicines
  async getMedicines() {
    return this.request('/medicines');
  }

  async addMedicine(body: any) {
    return this.request('/medicines', { method: 'POST', body: JSON.stringify(body) });
  }

  async updateMedicine(id: number, body: any) {
    return this.request(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  }

  async deleteMedicine(id: number) {
    return this.request(`/medicines/${id}`, { method: 'DELETE' });
  }

  async extractPrescription(imageBase64: string, mimeType = 'image/jpeg') {
    return this.request('/medicines/extract-prescription', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, mimeType }),
    });
  }

  // Reminders & Intake
  async getTodayReminders() {
    return this.request('/reminders/today');
  }

  async logReminder(body: any) {
    return this.request('/reminders/log', { method: 'POST', body: JSON.stringify(body) });
  }

  async getAdherence() {
    return this.request('/reminders/adherence');
  }

  async addCareChecklist(body: any) {
    return this.request('/reminders/care-checklists', { method: 'POST', body: JSON.stringify(body) });
  }

  async removeCareChecklist(id: number) {
    return this.request(`/reminders/care-checklists/${id}`, { method: 'DELETE' });
  }

  // Diet
  async getCurrentDiet() {
    return this.request('/diet/current');
  }

  async generateDiet() {
    return this.request('/diet/generate', { method: 'POST' });
  }

  async swapMeal(day: string, mealType: string) {
    return this.request('/diet/swap-meal', { method: 'POST', body: JSON.stringify({ day, mealType }) });
  }

  // Exercise
  async getCurrentExercise() {
    return this.request('/exercise/current');
  }

  async generateExercise(body: any = {}) {
    return this.request('/exercise/generate', { method: 'POST', body: JSON.stringify(body) });
  }

  async logWorkout(body: any) {
    return this.request('/exercise/log-workout', { method: 'POST', body: JSON.stringify(body) });
  }

  async getWorkoutHistory() {
    return this.request('/exercise/history');
  }

  // Vitals
  async getVitals(type?: string) {
    const url = type ? `/vitals?type=${type}` : '/vitals';
    return this.request(url);
  }

  async addVital(body: any) {
    return this.request('/vitals', { method: 'POST', body: JSON.stringify(body) });
  }

  async deleteVital(id: number) {
    return this.request(`/vitals/${id}`, { method: 'DELETE' });
  }

  // Dashboard
  async getDashboard() {
    return this.request('/dashboard');
  }

  async updateWater(action: 'increment' | 'decrement' | 'set', amount = 1) {
    return this.request('/dashboard/water', { method: 'POST', body: JSON.stringify({ action, amount }) });
  }
}

export const api = new ApiService();
