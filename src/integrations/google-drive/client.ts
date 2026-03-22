/**
 * Stub — Google Sheets desativado. Toda persistência é via JSON local.
 */
export class GoogleSheetsClient {
  private static instance: GoogleSheetsClient;
  public static getInstance(): GoogleSheetsClient {
    if (!GoogleSheetsClient.instance) GoogleSheetsClient.instance = new GoogleSheetsClient();
    return GoogleSheetsClient.instance;
  }
  async getSheetData(_sheetName: string): Promise<any[]> { return []; }
  async appendRow(_sheetName: string, _data: any): Promise<void> {}
  async updateRow(_sheetName: string, _id: string, _data: any): Promise<void> {}
  async deleteRow(_sheetName: string, _id: string): Promise<void> {}
}
export const googleSheets = GoogleSheetsClient.getInstance();
