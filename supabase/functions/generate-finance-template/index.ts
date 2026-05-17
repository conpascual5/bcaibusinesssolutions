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

    console.log("[generate-finance-template] Generating template", { format })

    const wb = XLSX.utils.book_new()

    // ============================================================
    // SHEET 1: Business Dashboard
    // ============================================================
    const dashData = [
      ['BUSINESS FINANCE TRACKING - DASHBOARD'],
      [''],
      ['Key Metrics', 'Value', 'Status'],
      ['Total Products/Services', 0, '—'],
      ['Total Sales (All Time)', 0, '—'],
      ['Total Expenses (All Time)', 0, '—'],
      ['Net Profit (All Time)', 0, '—'],
      ['Today\'s Sales', 0, '—'],
      ['Today\'s Expenses', 0, '—'],
      ['Today\'s Net Profit', 0, '—'],
      ['Profit Margin %', 0, '—'],
      [''],
      ['Quick Actions'],
      ['Add Product/Service', '→ Go to Product/Service List Sheet'],
      ['Log Sales', '→ Go to Sales Listing Sheet'],
      ['Log Expense', '→ Go to Expense Listing Sheet'],
      ['View Daily Report', '→ Go to Daily Sales Report Sheet'],
      [''],
      ['Notes'],
      ['This dashboard auto-populates from other sheets.'],
      ['Fill in data in each sheet below.'],
    ]
    const wsDash = XLSX.utils.aoa_to_sheet(dashData)
    wsDash['!cols'] = [{ wch: 36 }, { wch: 24 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, wsDash, 'Dashboard')

    // ============================================================
    // SHEET 2: Product/Service List
    // ============================================================
    const prodHeaders = ['Item ID', 'Item Name', 'Type', 'Category', 'Unit Cost (PHP)', 'Selling Price (PHP)', 'SKU/Code', 'Supplier/Provider', 'Notes']
    const prodData = [
      ['BUSINESS FINANCE TRACKING - PRODUCT/SERVICE LIST'],
      [''],
      prodHeaders,
      ['ITEM-001', '', 'Product', '', 0, 0, '', '', ''],
      ['ITEM-002', '', 'Service', '', 0, 0, '', '', ''],
      ['ITEM-003', '', 'Product', '', 0, 0, '', '', ''],
      ['ITEM-004', '', 'Service', '', 0, 0, '', '', ''],
      ['ITEM-005', '', 'Product', '', 0, 0, '', '', ''],
    ]
    const wsProducts = XLSX.utils.aoa_to_sheet(prodData)
    wsProducts['!cols'] = [{ wch: 12 }, { wch: 26 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 22 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Product-Service List')

    // ============================================================
    // SHEET 3: Sales Listing
    // ============================================================
    const salesHeaders = ['Date', 'Item ID', 'Item Name', 'Type', 'Quantity', 'Unit Price (PHP)', 'Total Sales (PHP)', 'Channel', 'Customer', 'Payment Method', 'Sold By', 'Notes']
    const salesData = [
      ['BUSINESS FINANCE TRACKING - SALES LISTING'],
      [''],
      salesHeaders,
      ['=TODAY()', 'ITEM-001', '', 'Product', 1, 0, '=E4*F4', 'Walk-in', '', 'Cash', '', ''],
      ['=TODAY()', 'ITEM-002', '', 'Service', 1, 0, '=E5*F5', 'Online', '', 'GCash', '', ''],
    ]
    const wsSales = XLSX.utils.aoa_to_sheet(salesData)
    wsSales['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 26 }, { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 20 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, wsSales, 'Sales Listing')

    // ============================================================
    // SHEET 4: Expense Listing
    // ============================================================
    const expenseHeaders = ['Date', 'Expense ID', 'Expense Name', 'Category', 'Amount (PHP)', 'Payment Method', 'Paid To', 'Reference #', 'Paid By', 'Receipt', 'Notes']
    const expenseData = [
      ['BUSINESS FINANCE TRACKING - EXPENSE LISTING'],
      [''],
      expenseHeaders,
      ['=TODAY()', 'EXP-001', '', 'Utilities', 0, 'Cash', '', '', '', '', ''],
      ['=TODAY()', 'EXP-002', '', 'Supplies', 0, 'GCash', '', '', '', '', ''],
      ['=TODAY()', 'EXP-003', '', 'Marketing', 0, 'Bank Transfer', '', '', '', '', ''],
    ]
    const wsExpenses = XLSX.utils.aoa_to_sheet(expenseData)
    wsExpenses['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 16 }, { wch: 20 }, { wch: 12 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expense Listing')

    // ============================================================
    // SHEET 5: Daily Sales Report
    // ============================================================
    const dailySalesHeaders = ['Date', 'Item ID', 'Item Name', 'Type', 'Units Sold', 'Unit Price (PHP)', 'Total Sales (PHP)', 'Cost of Goods (PHP)', 'Gross Profit (PHP)', 'Profit Margin %']
    const dailySalesData = [
      ['BUSINESS FINANCE TRACKING - DAILY SALES REPORT'],
      [''],
      dailySalesHeaders,
      ['=TODAY()', 'ITEM-001', '', 'Product', 0, 0, '=E4*F4', '=E4*0', '=G4-H4', '=IF(G4>0,I4/G4*100,0)'],
      ['=TODAY()', 'ITEM-002', '', 'Service', 0, 0, '=E5*F5', '=E5*0', '=G5-H5', '=IF(G5>0,I5/G5*100,0)'],
    ]
    const wsDailySales = XLSX.utils.aoa_to_sheet(dailySalesData)
    wsDailySales['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 26 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, wsDailySales, 'Daily Sales Report')

    // ============================================================
    // SHEET 6: Daily Expense Report
    // ============================================================
    const dailyExpHeaders = ['Date', 'Expense ID', 'Expense Name', 'Category', 'Amount (PHP)', 'Payment Method', '% of Total Expenses']
    const dailyExpData = [
      ['BUSINESS FINANCE TRACKING - DAILY EXPENSE REPORT'],
      [''],
      dailyExpHeaders,
      ['=TODAY()', 'EXP-001', '', 'Utilities', 0, 'Cash', '=IF(E4>0,E4/SUM(E:E)*100,0)'],
      ['=TODAY()', 'EXP-002', '', 'Supplies', 0, 'GCash', '=IF(E5>0,E5/SUM(E:E)*100,0)'],
      ['=TODAY()', 'EXP-003', '', 'Marketing', 0, 'Bank Transfer', '=IF(E6>0,E6/SUM(E:E)*100,0)'],
    ]
    const wsDailyExp = XLSX.utils.aoa_to_sheet(dailyExpData)
    wsDailyExp['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsDailyExp, 'Daily Expense Report')

    // ============================================================
    // SHEET 7: Yearly Records
    // ============================================================
    const yearlyHeaders = ['Year', 'Month', 'Total Sales (PHP)', 'Total Expenses (PHP)', 'Net Profit (PHP)', 'Profit Margin %', 'Top Selling Item', 'Highest Expense Category', 'Notes']
    const yearlyData = [
      ['BUSINESS FINANCE TRACKING - YEARLY RECORDS'],
      [''],
      ['This sheet stores multi-year data for financial audits and bookkeeping.'],
      ['Copy rows from Daily Sales Report and Daily Expense Report at end of each month.'],
      [''],
      yearlyHeaders,
      ['=YEAR(TODAY())', 'January', 0, 0, '=C7-D7', '=IF(C7>0,E7/C7*100,0)', '', '', ''],
      ['=YEAR(TODAY())', 'February', 0, 0, '=C8-D8', '=IF(C8>0,E8/C8*100,0)', '', '', ''],
      ['=YEAR(TODAY())', 'March', 0, 0, '=C9-D9', '=IF(C9>0,E9/C9*100,0)', '', '', ''],
      ['=YEAR(TODAY())', 'April', 0, 0, '=C10-D10', '=IF(C10>0,E10/C10*100,0)', '', '', ''],
      ['=YEAR(TODAY())', 'May', 0, 0, '=C11-D11', '=IF(C11>0,E11/C11*100,0)', '', '', ''],
      ['=YEAR(TODAY())', 'June', 0, 0, '=C12-D12', '=IF(C12>0,E12/C12*100,0)', '', '', ''],
      ['=YEAR(TODAY())', 'July', 0, 0, '=C13-D13', '=IF(C13>0,E13/C13*100,0)', '', '', ''],
      ['=YEAR(TODAY())', 'August', 0, 0, '=C14-D14', '=IF(C14>0,E14/C14*100,0)', '', '', ''],
      ['=YEAR(TODAY())', 'September', 0, 0, '=C15-D15', '=IF(C15>0,E15/C15*100,0)', '', '', ''],
      ['=YEAR(TODAY())', 'October', 0, 0, '=C16-D16', '=IF(C16>0,E16/C16*100,0)', '', '', ''],
      ['=YEAR(TODAY())', 'November', 0, 0, '=C17-D17', '=IF(C17>0,E17/C17*100,0)', '', '', ''],
      ['=YEAR(TODAY())', 'December', 0, 0, '=C18-D18', '=IF(C18>0,E18/C18*100,0)', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['ANNUAL TOTALS', '', '=SUM(C7:C18)', '=SUM(D7:D18)', '=SUM(E7:E18)', '=IF(C20>0,E20/C20*100,0)', '', '', ''],
    ]
    const wsYearly = XLSX.utils.aoa_to_sheet(yearlyData)
    wsYearly['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 22 }, { wch: 24 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, wsYearly, 'Yearly Records')

    // ============================================================
    // SHEET 8: User Guide
    // ============================================================
    const guideData = [
      ['BUSINESS FINANCE TRACKING - USER GUIDE'],
      [''],
      ['GETTING STARTED'],
      ['1. Start by adding your products/services in the "Product-Service List" sheet.'],
      ['2. When you make a sale, log it in the "Sales Listing" sheet.'],
      ['3. When you incur an expense, log it in the "Expense Listing" sheet.'],
      ['4. Check "Daily Sales Report" and "Daily Expense Report" for daily performance.'],
      ['5. At end of each month, copy data to "Yearly Records" for bookkeeping.'],
      ['6. View "Dashboard" for key business insights and KPIs.'],
      [''],
      ['FEATURES'],
      ['• Product/Service List: Add all items with pricing and type (product or service).'],
      ['• Sales Listing: Record all sales across different channels.'],
      ['• Expense Listing: Track all business expenses by category.'],
      ['• Daily Sales Report: Summarized daily sales with profit analysis.'],
      ['• Daily Expense Report: Categorized expense breakdown.'],
      ['• Yearly Records: Multi-year data storage for audits.'],
      ['• Dashboard: Key metrics and KPIs at a glance.'],
      [''],
      ['TIPS'],
      ['• Use unique Item IDs to link data across sheets.'],
      ['• Categorize expenses properly for accurate reporting.'],
      ['• Log sales and expenses daily for real-time dashboard updates.'],
      ['• Share the file with your team for multi-user access.'],
      ['• Backup your data regularly.'],
      ['• Works for both product-based AND service-based businesses.'],
    ]
    const wsGuide = XLSX.utils.aoa_to_sheet(guideData)
    wsGuide['!cols'] = [{ wch: 80 }]
    XLSX.utils.book_append_sheet(wb, wsGuide, 'User Guide')

    // Generate the file buffer
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

    const fileName = `Finance-Tracker-${format}.xlsx`

    console.log("[generate-finance-template] File generated successfully", { fileName, size: wbout.byteLength })

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
    console.error("[generate-finance-template] Error", { error: error.message })
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
