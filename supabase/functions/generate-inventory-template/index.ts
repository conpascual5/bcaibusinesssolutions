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

    console.log("[generate-inventory-template] Generating template", { format })

    const wb = XLSX.utils.book_new()

    // ============================================================
    // SHEET 1: Inventory Dashboard
    // ============================================================
    const dashData = [
      ['ACCURATE INVENTORY TRACKING - DASHBOARD'],
      [''],
      ['Key Metrics', 'Value', 'Status'],
      ['Total Products', 0, '—'],
      ['Total Stock In (All Time)', 0, '—'],
      ['Total Stock Out (All Time)', 0, '—'],
      ['Current Stock on Hand', 0, '—'],
      ['Low Stock Items', 0, '⚠ Needs Attention'],
      ['Out of Stock Items', 0, '❌ Reorder Needed'],
      ['Today\'s Sales (Units)', 0, '—'],
      ['Today\'s Sales (PHP)', 0, '—'],
      [''],
      ['Quick Actions'],
      ['Add New Product', '→ Go to Product List Sheet'],
      ['Log Stock In', '→ Go to Stock In Log Sheet'],
      ['Log Stock Out', '→ Go to Stock Out Log Sheet'],
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
    // SHEET 2: Product List
    // ============================================================
    const prodHeaders = ['Product ID', 'Product Name', 'Category', 'Unit Cost (PHP)', 'Selling Price (PHP)', 'SKU/Barcode', 'Supplier', 'Current Stock', 'Reorder Level', 'Stock Status', 'Last Updated']
    const prodData = [
      ['ACCURATE INVENTORY TRACKING - PRODUCT LIST'],
      [''],
      prodHeaders,
      ['PROD-001', '', '', 0, 0, '', '', 0, 10, '=IF(H4<=I4,"Reorder","OK")', ''],
      ['PROD-002', '', '', 0, 0, '', '', 0, 10, '=IF(H5<=I5,"Reorder","OK")', ''],
      ['PROD-003', '', '', 0, 0, '', '', 0, 10, '=IF(H6<=I6,"Reorder","OK")', ''],
      ['PROD-004', '', '', 0, 0, '', '', 0, 10, '=IF(H7<=I7,"Reorder","OK")', ''],
      ['PROD-005', '', '', 0, 0, '', '', 0, 10, '=IF(H8<=I8,"Reorder","OK")', ''],
    ]
    const wsProducts = XLSX.utils.aoa_to_sheet(prodData)
    wsProducts['!cols'] = [{ wch: 14 }, { wch: 26 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Product List')

    // ============================================================
    // SHEET 3: Stock In Log
    // ============================================================
    const stockInHeaders = ['Date', 'Product ID', 'Product Name', 'Quantity Received', 'Unit Cost (PHP)', 'Total Cost (PHP)', 'Supplier', 'Reference #', 'Received By', 'Notes']
    const stockInData = [
      ['ACCURATE INVENTORY TRACKING - STOCK IN LOG'],
      [''],
      stockInHeaders,
      ['=TODAY()', 'PROD-001', '', 0, 0, '=D4*E4', '', '', '', ''],
      ['=TODAY()', 'PROD-002', '', 0, 0, '=D5*E5', '', '', '', ''],
    ]
    const wsStockIn = XLSX.utils.aoa_to_sheet(stockInData)
    wsStockIn['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 26 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 20 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, wsStockIn, 'Stock In Log')

    // ============================================================
    // SHEET 4: Stock Out Log
    // ============================================================
    const stockOutHeaders = ['Date', 'Product ID', 'Product Name', 'Quantity Sold', 'Unit Price (PHP)', 'Total Sales (PHP)', 'Customer', 'Payment Method', 'Sold By', 'Notes']
    const stockOutData = [
      ['ACCURATE INVENTORY TRACKING - STOCK OUT LOG'],
      [''],
      stockOutHeaders,
      ['=TODAY()', 'PROD-001', '', 0, 0, '=D4*E4', '', 'Cash', '', ''],
      ['=TODAY()', 'PROD-002', '', 0, 0, '=D5*E5', '', 'GCash', '', ''],
    ]
    const wsStockOut = XLSX.utils.aoa_to_sheet(stockOutData)
    wsStockOut['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 26 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 20 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, wsStockOut, 'Stock Out Log')

    // ============================================================
    // SHEET 5: Inventory Status
    // ============================================================
    const statusHeaders = ['Product ID', 'Product Name', 'Beginning Stock', 'Total Stock In', 'Total Stock Out', 'Current Stock', 'Stock Value (PHP)', 'Status', 'Action Needed']
    const statusData = [
      ['ACCURATE INVENTORY TRACKING - INVENTORY STATUS'],
      [''],
      ['This sheet auto-calculates inventory levels based on Stock In and Stock Out logs.'],
      [''],
      statusHeaders,
      ['PROD-001', '', 0, 0, 0, '=C6+D6-E6', '=F6*0', '=IF(F6<=10,"Low Stock","In Stock")', '=IF(F6<=10,"Reorder Now","—")'],
      ['PROD-002', '', 0, 0, 0, '=C7+D7-E7', '=F7*0', '=IF(F7<=10,"Low Stock","In Stock")', '=IF(F7<=10,"Reorder Now","—")'],
      ['PROD-003', '', 0, 0, 0, '=C8+D8-E8', '=F8*0', '=IF(F8<=10,"Low Stock","In Stock")', '=IF(F8<=10,"Reorder Now","—")'],
      ['PROD-004', '', 0, 0, 0, '=C9+D9-E9', '=F9*0', '=IF(F9<=10,"Low Stock","In Stock")', '=IF(F9<=10,"Reorder Now","—")'],
      ['PROD-005', '', 0, 0, 0, '=C10+D10-E10', '=F10*0', '=IF(F10<=10,"Low Stock","In Stock")', '=IF(F10<=10,"Reorder Now","—")'],
    ]
    const wsStatus = XLSX.utils.aoa_to_sheet(statusData)
    wsStatus['!cols'] = [{ wch: 14 }, { wch: 26 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, wsStatus, 'Inventory Status')

    // ============================================================
    // SHEET 6: Daily Sales Report
    // ============================================================
    const dailyHeaders = ['Date', 'Product ID', 'Product Name', 'Units Sold', 'Unit Price (PHP)', 'Total Sales (PHP)', 'Cost of Goods Sold (PHP)', 'Gross Profit (PHP)', 'Profit Margin %']
    const dailyData = [
      ['ACCURATE INVENTORY TRACKING - DAILY SALES REPORT'],
      [''],
      dailyHeaders,
      ['=TODAY()', 'PROD-001', '', 0, 0, '=D4*E4', '=D4*0', '=F4-G4', '=IF(F4>0,H4/F4*100,0)'],
      ['=TODAY()', 'PROD-002', '', 0, 0, '=D5*E5', '=D5*0', '=F5-G5', '=IF(F5>0,H5/F5*100,0)'],
    ]
    const wsDaily = XLSX.utils.aoa_to_sheet(dailyData)
    wsDaily['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 26 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Sales Report')

    // ============================================================
    // SHEET 7: Yearly Records
    // ============================================================
    const yearlyHeaders = ['Year', 'Month', 'Total Stock In', 'Total Stock Out', 'Net Movement', 'Total Sales (PHP)', 'Total COGS (PHP)', 'Gross Profit (PHP)', 'Top Selling Product', 'Notes']
    const yearlyData = [
      ['ACCURATE INVENTORY TRACKING - YEARLY RECORDS'],
      [''],
      ['This sheet stores multi-year data for inventory audit and analysis.'],
      ['Copy rows from Daily Sales Report and Stock Logs at end of each month.'],
      [''],
      yearlyHeaders,
      ['=YEAR(TODAY())', 'January', 0, 0, '=C7-D7', 0, 0, '=E7-F7', '', ''],
      ['=YEAR(TODAY())', 'February', 0, 0, '=C8-D8', 0, 0, '=E8-F8', '', ''],
      ['=YEAR(TODAY())', 'March', 0, 0, '=C9-D9', 0, 0, '=E9-F9', '', ''],
      ['=YEAR(TODAY())', 'April', 0, 0, '=C10-D10', 0, 0, '=E10-F10', '', ''],
      ['=YEAR(TODAY())', 'May', 0, 0, '=C11-D11', 0, 0, '=E11-F11', '', ''],
      ['=YEAR(TODAY())', 'June', 0, 0, '=C12-D12', 0, 0, '=E12-F12', '', ''],
      ['=YEAR(TODAY())', 'July', 0, 0, '=C13-D13', 0, 0, '=E13-F13', '', ''],
      ['=YEAR(TODAY())', 'August', 0, 0, '=C14-D14', 0, 0, '=E14-F14', '', ''],
      ['=YEAR(TODAY())', 'September', 0, 0, '=C15-D15', 0, 0, '=E15-F15', '', ''],
      ['=YEAR(TODAY())', 'October', 0, 0, '=C16-D16', 0, 0, '=E16-F16', '', ''],
      ['=YEAR(TODAY())', 'November', 0, 0, '=C17-D17', 0, 0, '=E17-F17', '', ''],
      ['=YEAR(TODAY())', 'December', 0, 0, '=C18-D18', 0, 0, '=E18-F18', '', ''],
      ['', '', '', '', '', '', '', '', '', ''],
      ['ANNUAL TOTALS', '', '=SUM(C7:C18)', '=SUM(D7:D18)', '=SUM(E7:E18)', '=SUM(F7:F18)', '=SUM(G7:G18)', '=SUM(H7:H18)', '', ''],
    ]
    const wsYearly = XLSX.utils.aoa_to_sheet(yearlyData)
    wsYearly['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, wsYearly, 'Yearly Records')

    // ============================================================
    // SHEET 8: User Guide
    // ============================================================
    const guideData = [
      ['ACCURATE INVENTORY TRACKING - USER GUIDE'],
      [''],
      ['GETTING STARTED'],
      ['1. Start by adding your products in the "Product List" sheet.'],
      ['2. When new stock arrives, log it in the "Stock In Log" sheet.'],
      ['3. When items are sold, log them in the "Stock Out Log" sheet.'],
      ['4. Check "Inventory Status" for real-time stock levels.'],
      ['5. View "Daily Sales Report" to monitor daily performance.'],
      ['6. At end of each month, copy data to "Yearly Records" for audit.'],
      [''],
      ['FEATURES'],
      ['• Product List: Add all your products with pricing and supplier info.'],
      ['• Stock In Log: Record all incoming inventory with costs.'],
      ['• Stock Out Log: Record all sales and outgoing items.'],
      ['• Inventory Status: Auto-calculates current stock levels.'],
      ['• Daily Sales Report: Track daily sales with profit analysis.'],
      ['• Yearly Records: Multi-year data storage for audit.'],
      ['• Dashboard: Key metrics and KPIs at a glance.'],
      [''],
      ['TIPS'],
      ['• Use unique Product IDs to link data across sheets.'],
      ['• Set reorder levels to get alerts when stock is low.'],
      ['• Update unit costs regularly for accurate profit calculations.'],
      ['• Share the file with your team for multi-user access.'],
      ['• Backup your data regularly.'],
    ]
    const wsGuide = XLSX.utils.aoa_to_sheet(guideData)
    wsGuide['!cols'] = [{ wch: 80 }]
    XLSX.utils.book_append_sheet(wb, wsGuide, 'User Guide')

    // Generate the file buffer
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

    const fileName = `Inventory-Tracker-${format}.xlsx`

    console.log("[generate-inventory-template] File generated successfully", { fileName, size: wbout.byteLength })

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
    console.error("[generate-inventory-template] Error", { error: error.message })
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
