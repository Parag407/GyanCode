import * as XLSX from 'xlsx';

/**
 * Generates an Excel report from system data
 * @param {Object} data - The statistics and lists to include
 * @param {string} filename - Base name for the file
 */
export const generateExcelReport = (data, filename = 'System_Report') => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Overview Stats
  const overviewData = [
    ['Metric', 'Value'],
    ['Total Users', data.totalUsers || 0],
    ['Students', data.studentCount || 0],
    ['Educators', data.educatorCount || 0],
    ['Total Assignments', data.totalAssignments || 0],
    ['Total Submissions', data.totalSubmissions || 0],
    ['Success (Passed)', data.successCount || 0],
    ['Failed', data.failCount || 0],
    ['Today Submissions', data.todaySubmissions || 0],
    ['Platform Pass Rate', (data.totalSubmissions ? ((data.successCount / data.totalSubmissions) * 100).toFixed(1) : 0) + '%'],
    ['Report Generated At', new Date().toLocaleString()]
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

  // Sheet 2: Assignments (if available)
  if (data.assignments && data.assignments.length > 0) {
    const assignData = data.assignments.map(a => ({
      ID: a.id,
      Title: a.title,
      Language: a.language,
      Difficulty: a.difficulty,
      Active: a.is_active ? 'Yes' : 'No',
      Created: new Date(a.created_at).toLocaleDateString()
    }));
    const wsAssign = XLSX.utils.json_to_sheet(assignData);
    XLSX.utils.book_append_sheet(wb, wsAssign, 'Assignments');
  }

  // Write file
  XLSX.writeFile(wb, `${filename}_${new Date().getTime()}.xlsx`);
};
