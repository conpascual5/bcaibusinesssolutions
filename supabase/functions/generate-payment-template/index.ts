import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import * as XLSX from "https://esm.sh/xlsx@0.18.5"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const format = url.searchParams.get('format') || 'excel'

    console.log("[generate-payment-template] Generating template", { format })

    const wb = XLSX.utils.book_new()

    // ============================================================
    // SHEET 1: Dashboard
    // ============================================================
    const dashData = [
      ['CLIENT PAYMENT TRACKER - DASHBOARD'],
      [''],
      ['Key Metrics', 'Value', 'Status'],
      ['Total Clients', 0, '—'],
      ['Total Payments Collected', 0, '—'],
      ['Total Amount Collected (PHP)', 0, '—'],
      ['Total Outstanding Dues (PHP)', 0, '—'],
      ['Overdue Accounts', 0, '⚠ Needs Attention'],
      ['This Month\'s Collections (PHP)', 0, '—'],
      ['Last Month\'s Dues (PHP)', 0, '—'],
      ['Current Month\'s Dues (PHP)', 0, '—'],
      ['Collection Rate %', 0, '—'],
      [''],
      ['Quick Actions'],
      ['Add New Client', '→ Go to Client List Sheet'],
      ['Log Payment', '→ Go to Payments List Sheet'],
      ['View Payment Report', '→ Go to Payments Report Sheet'],
      ['Check Client History', '→ Go to Client Report Sheet'],
      [''],
      ['Notes'],
      ['This dashboard auto-populates from other sheets.'],
      ['Fill in data in each sheet below.'],
    ]
    const wsDash = XLSX.utils.aoa_to_sheet(dashData)
    wsDash['!cols'] = [{ wch: 36 }, { wch: 28 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, wsDash, 'Dashboard')

    // ============================================================
    // SHEET 2: Client List
    // ============================================================
    const clientHeaders = ['Client ID', 'Client Name', 'Company/Organization', 'Contact Number', 'Email Address', 'Address', 'Service/Product Availed', 'Total Amount Due (PHP)', 'Amount Paid (PHP)', 'Balance (PHP)', 'Status', 'Date Added', 'Notes']
    const clientData = [
      ['CLIENT PAYMENT TRACKER - CLIENT LIST'],
      [''],
      clientHeaders,
      ['CLT-001', '', '', '', '', '', '', 0, 0, '=H4-I4', '=IF(J4<=0,"Paid","Pending")', '=TODAY()', ''],
      ['CLT-002', '', '', '', '', '', '', 0, 0, '=H5-I5', '=IF(J5<=0,"Paid","Pending")', '=TODAY()', ''],
      ['CLT-003', '', '', '', '', '', '', 0, 0, '=H6-I6', '=IF(J6<=0,"Paid","Pending")', '=TODAY()', ''],
      ['CLT-004', '', '', '', '', '', '', 0, 0, '=H7-I7', '=IF(J7<=0,"Paid","Pending")', '=TODAY()', ''],
      ['CLT-005', '', '', '', '', '', '', 0, 0, '=H8-I8', '=IF(J8<=0,"Paid","Pending")', '=TODAY()', ''],
    ]
    const wsClients = XLSX.utils.aoa_to_sheet(clientData)
    wsClients['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 24 }, { wch: 18 }, { wch: 26 }, { wch: 24 }, { wch: 24 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, wsClients, 'Client List')

    // ============================================================
    // SHEET 3: Payments List
    // ============================================================
    const paymentHeaders = ['Date', 'Payment ID', 'Client ID', 'Client Name', 'Amount Paid (PHP)', 'Payment Method', 'Reference #', 'Payment For', 'Due Date', 'Days Overdue', 'Collected By', 'Notes']
    const paymentData = [
      ['CLIENT PAYMENT TRACKER - PAYMENTS LIST'],
      [''],
      ['Log all daily payments and transactions here.'],
      [''],
      paymentHeaders,
      ['=TODAY()', 'PAY-001', 'CLT-001', '', 0, 'Cash', '', '', '', '=IF(TODAY()>I6,TODAY()-I6,0)', '', ''],
      ['=TODAY()', 'PAY-002', 'CLT-002', '', 0, 'GCash', '', '', '', '=IF(TODAY()>I7,TODAY()-I7,0)', '', ''],
      ['=TODAY()', 'PAY-003', 'CLT-003', '', 0, 'Bank Transfer', '', '', '', '=IF(TODAY()>I8,TODAY()-I8,0)', '', ''],
    ]
    const wsPayments = XLSX.utils.aoa_to_sheet(paymentData)
    wsPayments['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Payments List')

    // ============================================================
    // SHEET 4: Payments Report
    // ============================================================
    const reportHeaders = ['Date', 'Total Payments (PHP)', 'Number of Transactions', 'Average Payment (PHP)', 'Cash Payments (PHP)', 'GCash Payments (PHP)', 'Bank Transfer (PHP)', 'Other Methods (PHP)', 'Notes']
    const reportData = [
      ['CLIENT PAYMENT TRACKER - PAYMENTS REPORT'],
      [''],
      ['Summarize payments by date for analysis.'],
      [''],
      reportHeaders,
      ['=TODAY()', 0, 0, '=IF(C6>0,B6/C6,0)', 0, 0, 0, 0, ''],
      ['=TODAY()-1', 0, 0, '=IF(C7>0,B7/C7,0)', 0, 0, 0, 0, ''],
      ['=TODAY()-2', 0, 0, '=IF(C8>0,B8/C8,0)', 0, 0, 0, 0, ''],
    ]
    const wsReport = XLSX.utils.aoa_to_sheet(reportData)
    wsReport['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, wsReport, 'Payments Report')

    // ============================================================
    // SHEET 5: Client Report
    // ============================================================
    const clientReportHeaders = ['Client ID', 'Client Name', 'Total Transactions', 'Total Amount Due (PHP)', 'Total Amount Paid (PHP)', 'Outstanding Balance (PHP)', 'Last Payment Date', 'Last Payment Amount (PHP)', 'Payment History', 'Status']
    const clientReportData = [
      ['CLIENT PAYMENT TRACKER - CLIENT REPORT'],
      [''],
      ['Review each client\'s payment history and transaction records.'],
      [''],
      clientReportHeaders,
      ['CLT-001', '', 0, 0, 0, '=D6-E6', '', 0, '', '=IF(F6<=0,"Fully Paid","Has Balance")'],
      ['CLT-002', '', 0, 0, 0, '=D7-E7', '', 0, '', '=IF(F7<=0,"Fully Paid","Has Balance")'],
      ['CLT-003', '', 0, 0, 0, '=D8-E8', '', 0, '', '=IF(F8<=0,"Fully Paid","Has Balance")'],
      ['CLT-004', '', 0, 0, 0, '=D9-E9', '', 0, '', '=IF(F9<=0,"Fully Paid","Has Balance")'],
      ['CLT-005', '', 0, 0, 0, '=D10-E10', '', 0, '', '=IF(F10<=0,"Fully Paid","Has Balance")'],
    ]
    const wsClientReport = XLSX.utils.aoa_to_sheet(clientReportData)
    wsClientReport['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 22 }, { wch: 24 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, wsClientReport, 'Client Report')

    // ============================================================
    // SHEET 6: Yearly Records
    // ============================================================
    const yearlyHeaders = ['Year', 'Month', 'Total Collections (PHP)', 'Number of Payments', 'Average Payment (PHP)', 'Total Clients Served', 'New Clients Added', 'Outstanding Dues (PHP)', 'Collection Rate %', 'Notes']
    const yearlyData = [
      ['CLIENT PAYMENT TRACKER - YEARLY RECORDS'],
      [''],
      ['This sheet stores multi-year data for receivables audit and analysis.'],
      ['Copy rows from Payments Report at end of each month.'],
      [''],
      yearlyHeaders,
      ['=YEAR(TODAY())', 'January', 0, 0, '=IF(D7>0,C7/D7,0)', 0, 0, 0, '=IF(C7>0,(C7-I7)/C7*100,0)', ''],
      ['=YEAR(TODAY())', 'February', 0, 0, '=IF(D8>0,C8/D8,0)', 0, 0, 0, '=IF(C8>0,(C8-I8)/C8*100,0)', ''],
      ['=YEAR(TODAY())', 'March', 0, 0, '=IF(D9>0,C9/D9,0)', 0, 0, 0, '=IF(C9>0,(C9-I9)/C9*100,0)', ''],
      ['=YEAR(TODAY())', 'April', 0, 0, '=IF(D10>0,C10/D10,0)', 0, 0, 0, '=IF(C10>0,(C10-I10)/C10*100,0)', ''],
      ['=YEAR(TODAY())', 'May', 0, 0, '=IF(D11>0,C11/D11,0)', 0, 0, 0, '=IF(C11>0,(C11-I11)/C11*100,0)', ''],
      ['=YEAR(TODAY())', 'June', 0, 0, '=IF(D12>0,C12/D12,0)', 0, 0, 0, '=IF(C12>0,(C12-I12)/C12*100,0)', ''],
      ['=YEAR(TODAY())', 'July', 0, 0, '=IF(D13>0,C13/D13,0)', 0, 0, 0, '=IF(C13>0,(C13-I13)/C13*100,0)', ''],
      ['=YEAR(TODAY())', 'August', 0, 0, '=IF(D14>0,C14/D14,0)', 0, 0, 0, '=IF(C14>0,(C14-I14)/C14*100,0)', ''],
      ['=YEAR(TODAY())', 'September', 0, 0, '=IF(D15>0,C15/D15,0)', 0, 0, 0, '=IF(C15>0,(C15-I15)/C15*100,0)', ''],
      ['=YEAR(TODAY())', 'October', 0, 0, '=IF(D16>0,C16/D16,0)', 0, 0, 0, '=IF(C16>0,(C16-I16)/C16*100,0)', ''],
      ['=YEAR(TODAY())', 'November', 0, 0, '=IF(D17>0,C17/D17,0)', 0, 0, 0, '=IF(C17>0,(C17-I17)/C17*100,0)', ''],
      ['=YEAR(TODAY())', 'December', 0, 0, '=IF(D18>0,C18/D18,0)', 0, 0, 0, '=IF(C18>0,(C18-I18)/C18*100,0)', ''],
      ['', '', '', '', '', '', '', '', '', ''],
      ['ANNUAL TOTALS', '', '=SUM(C7:C18)', '=SUM(D7:D18)', '=IF(D20>0,C20/D20,0)', '', '=SUM(G7:G18)', '', '', ''],
    ]
    const wsYearly = XLSX.utils.aoa_to_sheet(yearlyData)
    wsYearly['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, wsYearly, 'Yearly Records')

    // ============================================================
    // SHEET 7: User Guide
    // ============================================================
    const guideData = [
      ['CLIENT PAYMENT TRACKER - USER GUIDE'],
      [''],
      ['GETTING STARTED'],
      ['1. Add your clients in the "Client List" sheet with their contact details and amount due.'],
      ['2. When a client makes a payment, log it in the "Payments List" sheet.'],
      ['3. Check "Payments Report" for by-date payment analysis.'],
      ['4. Review "Client Report" to see each client\'s payment history.'],
      ['5. At end of each month, copy data to "Yearly Records" for audit.'],
      ['6. View "Dashboard" for real-time KPIs on collections and dues.'],
      [''],
      ['FEATURES'],
      ['• Client List: Record all client details, dues, and payment status.'],
      ['• Payments List: Log all daily payments and transactions.'],
      ['• Payments Report: Analyze payments by date and method.'],
      ['• Client Report: Review individual client history and balances.'],
      ['• Yearly Records: Multi-year data storage for receivables audit.'],
      ['• Dashboard: Key metrics on collections, dues, and overdue accounts.'],
      [''],
      ['TIPS'],
      ['• Use unique Client IDs to link data across sheets.'],
      ['• Set due dates to automatically track overdue days.'],
      ['• Log payments immediately for real-time balance updates.'],
      ['• Share the file with your team for multi-user access.'],
      ['• Backup your data regularly.'],
      ['• Monitor the Dashboard for unpaid collections and overdue accounts.'],
    ]
    const wsGuide = XLSX.utils.aoa_to_sheet(guideData)
    wsGuide['!cols'] = [{ wch: 80 }]
    XLSX.utils.book_append_sheet(wb, wsGuide, 'User Guide')

    // Generate the file buffer
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

    const fileName = `Payment-Tracker-${format}.xlsx`

    console.log("[generate-payment-template] File generated successfully", { fileName, size: wbout.byteLength })

    return new Response(wbout, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': wbout.byteLength.toString(),
      },
      status: 200,
    })
  } catch (error) {
    console.error("[generate-payment-template] Error", { error: error.message })
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
