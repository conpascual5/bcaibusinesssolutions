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
    const { format } = await req.json()
    const isGsheets = format === 'gsheets'

    console.log("[generate-bms-template] Generating template", { format })

    const wb = XLSX.utils.book_new()

    // ============================================================
    // SHEET 1: Dashboard
    // ============================================================
    const dashboardData = [
      ['BUSINESS MANAGEMENT SYSTEM - DASHBOARD'],
      [''],
      ['Key Metrics', 'Value', 'Status'],
      ['Total Revenue (YTD)', 0, '—'],
      ['Total Expenses (YTD)', 0, '—'],
      ['Net Profit (YTD)', 0, '—'],
      ['Active Customers', 0, '—'],
      ['Inventory Items', 0, '—'],
      ['Pending Invoices', 0, '—'],
      ['Cash on Hand', 0, '—'],
      [''],
      ['Quick Actions'],
      ['Add Sale', '→ Go to Sales Sheet'],
      ['Add Expense', '→ Go to Expenses Sheet'],
      ['Create Invoice', '→ Go to Invoices Sheet'],
      ['Check Inventory', '→ Go to Inventory Sheet'],
      [''],
      ['Notes'],
      ['This dashboard auto-populates from other sheets.'],
      ['Fill in data in each tracker sheet below.'],
    ]
    const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData)
    wsDashboard['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, wsDashboard, 'Dashboard')

    // ============================================================
    // SHEET 2: Sales
    // ============================================================
    const salesHeaders = ['Date', 'Customer Name', 'Product/Service', 'Quantity', 'Unit Price (PHP)', 'Total (PHP)', 'Payment Method', 'Status', 'Notes']
    const salesData = [
      ['BUSINESS MANAGEMENT SYSTEM - SALES TRACKER'],
      [''],
      salesHeaders,
      ['=TODAY()', '', '', 0, 0, '=D4*E4', '', 'Completed', ''],
      ['=TODAY()', '', '', 0, 0, '=D5*E5', '', 'Pending', ''],
    ]
    const wsSales = XLSX.utils.aoa_to_sheet(salesData)
    wsSales['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 22 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsSales, 'Sales')

    // ============================================================
    // SHEET 3: Expenses
    // ============================================================
    const expenseHeaders = ['Date', 'Category', 'Description', 'Amount (PHP)', 'Payment Method', 'Receipt #', 'Vendor', 'Notes']
    const expenseData = [
      ['BUSINESS MANAGEMENT SYSTEM - EXPENSES TRACKER'],
      [''],
      expenseHeaders,
      ['=TODAY()', 'Operating', '', 0, 'GCash', '', '', ''],
      ['=TODAY()', 'Marketing', '', 0, 'Bank Transfer', '', '', ''],
    ]
    const wsExpenses = XLSX.utils.aoa_to_sheet(expenseData)
    wsExpenses['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 22 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses')

    // ============================================================
    // SHEET 4: Inventory
    // ============================================================
    const invHeaders = ['Product Name', 'SKU', 'Category', 'Unit Cost (PHP)', 'Selling Price (PHP)', 'Stock on Hand', 'Reorder Level', 'Stock Value (PHP)', 'Supplier', 'Last Restock Date']
    const invData = [
      ['BUSINESS MANAGEMENT SYSTEM - INVENTORY TRACKER'],
      [''],
      invHeaders,
      ['', '', '', 0, 0, 0, 10, '=D4*F4', '', ''],
      ['', '', '', 0, 0, 0, 10, '=D5*F5', '', ''],
    ]
    const wsInventory = XLSX.utils.aoa_to_sheet(invData)
    wsInventory['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 22 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventory')

    // ============================================================
    // SHEET 5: Customers
    // ============================================================
    const custHeaders = ['Customer ID', 'Full Name', 'Email', 'Phone Number', 'Address', 'City', 'Province', 'Total Purchases (PHP)', 'Last Purchase Date', 'Notes']
    const custData = [
      ['BUSINESS MANAGEMENT SYSTEM - CUSTOMER DATABASE'],
      [''],
      custHeaders,
      ['CUST-001', '', '', '', '', '', '', 0, '', ''],
      ['CUST-002', '', '', '', '', '', '', 0, '', ''],
    ]
    const wsCustomers = XLSX.utils.aoa_to_sheet(custData)
    wsCustomers['!cols'] = [{ wch: 14 }, { wch: 24 }, { wch: 28 }, { wch: 16 }, { wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsCustomers, 'Customers')

    // ============================================================
    // SHEET 6: Invoices
    // ============================================================
    const invHeaders2 = ['Invoice #', 'Customer', 'Date Issued', 'Due Date', 'Items', 'Subtotal (PHP)', 'Tax (12%)', 'Total (PHP)', 'Amount Paid (PHP)', 'Balance (PHP)', 'Status']
    const invData2 = [
      ['BUSINESS MANAGEMENT SYSTEM - INVOICES'],
      [''],
      invHeaders2,
      ['INV-001', '', '=TODAY()', '=TODAY()+30', '', 0, '=F4*0.12', '=F4+G4', 0, '=H4-I4', 'Unpaid'],
      ['INV-002', '', '=TODAY()', '=TODAY()+30', '', 0, '=F5*0.12', '=F5+G5', 0, '=H5-I5', 'Unpaid'],
    ]
    const wsInvoices = XLSX.utils.aoa_to_sheet(invData2)
    wsInvoices['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsInvoices, 'Invoices')

    // ============================================================
    // SHEET 7: Cash Flow
    // ============================================================
    const cfHeaders = ['Month', 'Starting Cash (PHP)', 'Total Income (PHP)', 'Total Expenses (PHP)', 'Net Cash Flow (PHP)', 'Ending Cash (PHP)']
    const cfData = [
      ['BUSINESS MANAGEMENT SYSTEM - CASH FLOW'],
      [''],
      cfHeaders,
      ['January', 0, 0, 0, '=C4-D4', '=B4+E4'],
      ['February', '=F4', 0, 0, '=C5-D5', '=B5+E5'],
      ['March', '=F5', 0, 0, '=C6-D6', '=B6+E6'],
      ['April', '=F6', 0, 0, '=C7-D7', '=B7+E7'],
      ['May', '=F7', 0, 0, '=C8-D8', '=B8+E8'],
      ['June', '=F8', 0, 0, '=C9-D9', '=B9+E9'],
      ['July', '=F9', 0, 0, '=C10-D10', '=B10+E10'],
      ['August', '=F10', 0, 0, '=C11-D11', '=B11+E11'],
      ['September', '=F11', 0, 0, '=C12-D12', '=B12+E12'],
      ['October', '=F12', 0, 0, '=C13-D13', '=B13+E13'],
      ['November', '=F13', 0, 0, '=C14-D14', '=B14+E14'],
      ['December', '=F14', 0, 0, '=C15-D15', '=B15+E15'],
    ]
    const wsCashflow = XLSX.utils.aoa_to_sheet(cfData)
    wsCashflow['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsCashflow, 'Cash Flow')

    // ============================================================
    // SHEET 8: Profit & Loss
    // ============================================================
    const pnlData = [
      ['BUSINESS MANAGEMENT SYSTEM - PROFIT & LOSS STATEMENT'],
      [''],
      ['Income', '', 'Amount (PHP)'],
      ['Total Sales Revenue', '', 0],
      ['Other Income', '', 0],
      ['Total Income', '', '=SUM(C4:C5)'],
      [''],
      ['Expenses', '', 'Amount (PHP)'],
      ['Operating Expenses', '', 0],
      ['Marketing Expenses', '', 0],
      ['Payroll', '', 0],
      ['Utilities', '', 0],
      ['Rent', '', 0],
      ['Other Expenses', '', 0],
      ['Total Expenses', '', '=SUM(C9:C14)'],
      [''],
      ['Net Profit / Loss', '', '=C6-C15'],
      ['Profit Margin (%)', '', '=IF(C6>0, C17/C6*100, 0)'],
    ]
    const wsPnL = XLSX.utils.aoa_to_sheet(pnlData)
    wsPnL['!cols'] = [{ wch: 24 }, { wch: 10 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsPnL, 'Profit & Loss')

    // ============================================================
    // SHEET 9: Sales Targets
    // ============================================================
    const targetHeaders = ['Month', 'Target Revenue (PHP)', 'Actual Revenue (PHP)', 'Achievement %', 'Target Expenses (PHP)', 'Actual Expenses (PHP)', 'Expense vs Budget %', 'Notes']
    const targetData = [
      ['BUSINESS MANAGEMENT SYSTEM - SALES TARGETS'],
      [''],
      targetHeaders,
      ['January', 0, 0, '=IF(B4>0,C4/B4*100,0)', 0, 0, '=IF(E4>0,F4/E4*100,0)', ''],
      ['February', 0, 0, '=IF(B5>0,C5/B5*100,0)', 0, 0, '=IF(E5>0,F5/E5*100,0)', ''],
      ['March', 0, 0, '=IF(B6>0,C6/B6*100,0)', 0, 0, '=IF(E6>0,F6/E6*100,0)', ''],
      ['April', 0, 0, '=IF(B7>0,C7/B7*100,0)', 0, 0, '=IF(E7>0,F7/E7*100,0)', ''],
      ['May', 0, 0, '=IF(B8>0,C8/B8*100,0)', 0, 0, '=IF(E8>0,F8/E8*100,0)', ''],
      ['June', 0, 0, '=IF(B9>0,C9/B9*100,0)', 0, 0, '=IF(E9>0,F9/E9*100,0)', ''],
      ['July', 0, 0, '=IF(B10>0,C10/B10*100,0)', 0, 0, '=IF(E10>0,F10/E10*100,0)', ''],
      ['August', 0, 0, '=IF(B11>0,C11/B11*100,0)', 0, 0, '=IF(E11>0,F11/E11*100,0)', ''],
      ['September', 0, 0, '=IF(B12>0,C12/B12*100,0)', 0, 0, '=IF(E12>0,F12/E12*100,0)', ''],
      ['October', 0, 0, '=IF(B13>0,C13/B13*100,0)', 0, 0, '=IF(E13>0,F13/E13*100,0)', ''],
      ['November', 0, 0, '=IF(B14>0,C14/B14*100,0)', 0, 0, '=IF(E14>0,F14/E14*100,0)', ''],
      ['December', 0, 0, '=IF(B15>0,C15/B15*100,0)', 0, 0, '=IF(E15>0,F15/E15*100,0)', ''],
      ['', '', '', '', '', '', '', ''],
      ['Annual Totals', '=SUM(B4:B15)', '=SUM(C4:C15)', '=IF(B17>0,C17/B17*100,0)', '=SUM(E4:E15)', '=SUM(F4:F15)', '=IF(E17>0,F17/E17*100,0)', ''],
    ]
    const wsTargets = XLSX.utils.aoa_to_sheet(targetData)
    wsTargets['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsTargets, 'Sales Targets')

    // ============================================================
    // SHEET 10: Products & Services
    // ============================================================
    const prodHeaders = ['Product/Service Name', 'Category', 'Unit Price (PHP)', 'Cost (PHP)', 'Gross Profit (PHP)', 'Gross Margin %', 'Active', 'Description']
    const prodData = [
      ['BUSINESS MANAGEMENT SYSTEM - PRODUCTS & SERVICES'],
      [''],
      prodHeaders,
      ['', '', 0, 0, '=C4-D4', '=IF(C4>0,E4/C4*100,0)', 'Yes', ''],
      ['', '', 0, 0, '=C5-D5', '=IF(C5>0,E5/C5*100,0)', 'Yes', ''],
    ]
    const wsProducts = XLSX.utils.aoa_to_sheet(prodData)
    wsProducts['!cols'] = [{ wch: 26 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 10 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Products')

    // ============================================================
    // SHEET 11: Employee / Payroll
    // ============================================================
    const payrollHeaders = ['Employee Name', 'Position', 'Daily Rate (PHP)', 'Days Worked', 'Gross Pay (PHP)', 'SSS', 'PhilHealth', 'Pag-IBIG', 'Withholding Tax', 'Total Deductions (PHP)', 'Net Pay (PHP)', 'Payment Date', 'Status']
    const payrollData = [
      ['BUSINESS MANAGEMENT SYSTEM - PAYROLL'],
      [''],
      ['SSS Rate: 4.5%', '', 'PhilHealth Rate: 3.5%', '', 'Pag-IBIG: 100', ''],
      [''],
      payrollHeaders,
      ['', '', 0, 0, '=C6*D6', '=E6*0.045', '=E6*0.035', 100, '=IF(E6>25000,(E6-25000)*0.15,0)', '=F6+G6+H6+I6', '=E6-J6', '', ''],
      ['', '', 0, 0, '=C7*D7', '=E7*0.045', '=E7*0.035', 100, '=IF(E7>25000,(E7-25000)*0.15,0)', '=F7+G7+H7+I7', '=E7-J7', '', ''],
    ]
    const wsPayroll = XLSX.utils.aoa_to_sheet(payrollData)
    wsPayroll['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsPayroll, 'Payroll')

    // ============================================================
    // SHEET 12: Yearly Summary
    // ============================================================
    const summaryHeaders = ['Month', 'Sales (PHP)', 'Expenses (PHP)', 'Profit (PHP)', 'Customers Acquired', 'Invoices Issued', 'Cash Flow (PHP)', 'Notes']
    const summaryData = [
      ['BUSINESS MANAGEMENT SYSTEM - YEARLY SUMMARY'],
      [''],
      summaryHeaders,
      ['January', 0, 0, '=B4-C4', 0, 0, '=B4-C4', ''],
      ['February', 0, 0, '=B5-C5', 0, 0, '=B5-C5', ''],
      ['March', 0, 0, '=B6-C6', 0, 0, '=B6-C6', ''],
      ['April', 0, 0, '=B7-C7', 0, 0, '=B7-C7', ''],
      ['May', 0, 0, '=B8-C8', 0, 0, '=B8-C8', ''],
      ['June', 0, 0, '=B9-C9', 0, 0, '=B9-C9', ''],
      ['July', 0, 0, '=B10-C10', 0, 0, '=B10-C10', ''],
      ['August', 0, 0, '=B11-C11', 0, 0, '=B11-C11', ''],
      ['September', 0, 0, '=B12-C12', 0, 0, '=B12-C12', ''],
      ['October', 0, 0, '=B13-C13', 0, 0, '=B13-C13', ''],
      ['November', 0, 0, '=B14-C14', 0, 0, '=B14-C14', ''],
      ['December', 0, 0, '=B15-C15', 0, 0, '=B15-C15', ''],
      ['', '', '', '', '', '', '', ''],
      ['TOTAL', '=SUM(B4:B15)', '=SUM(C4:C15)', '=SUM(D4:D15)', '=SUM(E4:E15)', '=SUM(F4:F15)', '=SUM(G4:G15)', ''],
    ]
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
    wsSummary['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Yearly Summary')

    // Generate the file buffer
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    const fileName = `bms-tracker-${format}.xlsx`
    const filePath = `templates/${fileName}`

    const storageUrl = `${supabaseUrl}/storage/v1/object/tracker_templates/${filePath}`

    const uploadRes = await fetch(storageUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'x-upsert': 'true',
      },
      body: wbout,
    })

    if (!uploadRes.ok) {
      const uploadError = await uploadRes.text()
      console.error("[generate-bms-template] Upload failed", { status: uploadRes.status, error: uploadError })
      throw new Error(`Upload failed: ${uploadError}`)
    }

    console.log("[generate-bms-template] Upload successful", { filePath })

    // Update the tracker_templates record with the storage path
    const supabaseClient = createSupabaseClient(supabaseUrl, supabaseServiceKey)
    const column = format === 'gsheets' ? 'storage_path_gsheets' : 'storage_path_excel'
    const { error: updateError } = await supabaseClient
      .from('tracker_templates')
      .update({ [column]: filePath })
      .eq('slug', 'business-management-system')

    if (updateError) {
      console.error("[generate-bms-template] Failed to update template record", { error: updateError })
    }

    // Generate a signed URL for download (valid for 1 hour)
    const signedUrlRes = await fetch(
      `${supabaseUrl}/storage/v1/object/sign/tracker_templates/${filePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresIn: 3600 }),
      }
    )

    let downloadUrl = ''
    if (signedUrlRes.ok) {
      const signedData = await signedUrlRes.json()
      downloadUrl = `${supabaseUrl}/storage/v1/object/sign/tracker_templates/${filePath}?token=${signedData.token}`
    } else {
      // Fallback to public URL
      downloadUrl = `${supabaseUrl}/storage/v1/object/public/tracker_templates/${filePath}`
    }

    return new Response(
      JSON.stringify({
        success: true,
        format,
        downloadUrl,
        filePath,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error("[generate-bms-template] Error", { error: error.message })
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

function createSupabaseClient(url: string, key: string) {
  // Simple fetch-based client for Supabase REST API
  const from = (table: string) => ({
    update: (data: Record<string, unknown>) => ({
      eq: async (column: string, value: string) => {
        const res = await fetch(`${url}/rest/v1/${table}?${column}=eq.${value}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${key}`,
            'apikey': key,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(data),
        })
        if (!res.ok) {
          const errText = await res.text()
          return { error: new Error(errText) }
        }
        return { error: null }
      },
    }),
  })
  return { from }
}
