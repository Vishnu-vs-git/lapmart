const Order=require('../../model/orderSchema');
const moment=require('moment');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Table } = require('pdfkit-table'); 
exports.getSalesReport = async (req, res) => {
    const { startDate, endDate, filter } = req.query;

    let filterDates = {};
    const now = new Date();

    // Apply quick filters
    if (filter === "day") {
        filterDates.startDate = new Date(now.setDate(now.getDate() - 1));
        filterDates.endDate = new Date();
    } else if (filter === "week") {
        filterDates.startDate = new Date(now.setDate(now.getDate() - 7));
        filterDates.endDate = new Date();
    } else if (filter === "month") {
        filterDates.startDate = new Date(now.setMonth(now.getMonth() - 1));
        filterDates.endDate = new Date();
    } else if (startDate && endDate) {
        filterDates.startDate = new Date(startDate);
        filterDates.endDate = new Date(endDate);
    }

    try {
        // Aggregate sales report
        const orders = await Order.aggregate([
            // Unwind the items array
            { $unwind: "$items" },

            // Match only items with paymentStatus = "paid"
            {
                $match: {
                    "items.paymentStatus": "paid",
                    createdAt: {
                        $gte: filterDates.startDate || new Date(0),
                        $lte: filterDates.endDate || new Date(),
                    },
                },
            },

            // Lookup product details for each item
            {
                $lookup: {
                    from: "products", // Collection name in the database
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },

            // Unwind product details
            { $unwind: "$productDetails" },

            // Calculate total discount and other fields
            {
                $group: {
                    _id: "$_id",
                    orderId: { $first: "$orderId" },
                    userId: { $first: "$userId" },
                    createdAt: { $first: "$createdAt" },
                    totalAmount: { $sum: "$items.itemTotal" },
                    couponDiscount: { $first: "$couponDiscount" },
                    totalDiscount: {
                        $sum: {
                            $add: [
                                { $subtract: ["$items.originalPrice", "$items.price"] }, // Per-item discount
                                { $ifNull: ["$couponDiscount", 0] }, // Coupon discount
                            ],
                        },
                    },
                    totalProductsSold: { $sum: "$items.quantity" }, // Total quantity sold
                    paymentMethod: { $first: "$paymentMethod" },
                },
            },

            // Sort results by creation date
            { $sort: { createdAt: -1 } },
        ]);

        // Calculate grand totals for the summary
        const totalOrders = orders.length;
        const totalSalesAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalDiscount = orders.reduce((sum, order) => sum + order.totalDiscount, 0);
        const totalProductsSold = orders.reduce((sum, order) => sum + order.totalProductsSold, 0);

        // Render the results to the sales report page
        res.render("admin/salesReport", {
            orders,
            totalOrders,
            totalSalesAmount,
            totalDiscount,
            totalProductsSold,
            startDate: filterDates.startDate?.toISOString().split("T")[0],
            endDate: filterDates.endDate?.toISOString().split("T")[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.downloadSalesReportPDF = async (req, res) => {
    const { startDate, endDate, filter } = req.query;

    let filterDates = {};
    const now = new Date();

    // Apply filters
    if (filter === "day") {
        filterDates.startDate = new Date(now.setDate(now.getDate() - 1));
        filterDates.endDate = new Date();
    } else if (filter === "week") {
        filterDates.startDate = new Date(now.setDate(now.getDate() - 7));
        filterDates.endDate = new Date();
    } else if (filter === "month") {
        filterDates.startDate = new Date(now.setMonth(now.getMonth() - 1));
        filterDates.endDate = new Date();
    } else if (startDate && endDate) {
        filterDates.startDate = new Date(startDate);
        filterDates.endDate = new Date(endDate);
    }

    try {
        // Fetch data from the database
        const orders = await Order.aggregate([
            { $unwind: "$items" },
            {
                $match: {
                    "items.paymentStatus": "paid",
                    createdAt: {
                        $gte: filterDates.startDate || new Date(0),
                        $lte: filterDates.endDate || new Date(),
                    },
                },
            },
            {
                $group: {
                    _id: "$_id",
                    orderId: { $first: "$orderId" },
                    userId: { $first: "$userId" },
                    createdAt: { $first: "$createdAt" },
                    totalAmount: { $sum: "$items.itemTotal" },
                    couponDiscount: { $first: "$couponDiscount" },
                    totalDiscount: {
                        $sum: {
                            $add: [
                                { $subtract: ["$items.originalPrice", "$items.price"] },
                                { $ifNull: ["$couponDiscount", 0] },
                            ],
                        },
                    },
                    totalProductsSold: { $sum: "$items.quantity" },
                    paymentMethod: { $first: "$paymentMethod" },
                },
            },
            { $sort: { createdAt: -1 } },
        ]);

        // Prepare summary data
        const totalOrders = orders.length;
        const totalSalesAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalDiscount = orders.reduce((sum, order) => sum + order.totalDiscount, 0);
        const totalProductsSold = orders.reduce((sum, order) => sum + order.totalProductsSold, 0);

        // Generate PDF
        const doc = new PDFDocument({ margin: 30 });
        const filename = `Sales_Report_${Date.now()}.pdf`;

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);

        // Title
        doc.fontSize(15).font('Helvetica-Bold').text('LapMart Sales Report', { align: 'center' });
        doc.moveDown(2);

        // Summary
        doc.fontSize(14)
            .text(`Total Orders: ${totalOrders}`, { align: 'left' })
            .text(`Total Sales Amount: $${totalSalesAmount.toFixed(2)}`, { align: 'left' })
            .text(`Total Discount: $${totalDiscount.toFixed(2)}`, { align: 'left' })
            .text(`Total Products Sold: ${totalProductsSold}`, { align: 'left' });
        doc.moveDown(2);

        // Table Header
        const tableTop = doc.y;
        const itemX = 50;

        const headers = [
            { label: 'Order ID', width: 120 },
            { label: 'User ID', width: 120 },
            { label: 'Date', width: 100 },
            { label: 'Amount', width: 80 },
            { label: 'Discount', width: 80 },
            { label: 'Payment Method', width: 80 },
        ];

        // Draw Header
        doc.fontSize(7).font('Helvetica-Bold');
        let colX = itemX;

        headers.forEach((header) => {
            doc.text(header.label, colX, tableTop, { width: header.width, align: 'left' });
            colX += header.width;
        });

        // Draw a horizontal line below the header
        doc.moveTo(itemX, tableTop + 15)
            .lineTo(itemX + colX - itemX, tableTop + 15)
            .stroke();

        // Draw Rows
        doc.font('Helvetica').fontSize(8);
        let rowY = tableTop + 25;

        orders.forEach((order) => {
            const row = [
                order.orderId,
                order.userId,
                moment(order.createdAt).format('YYYY-MM-DD'),
                `$${order.totalAmount.toFixed(2)}`,
                `$${order.totalDiscount.toFixed(2)}`,
                order.paymentMethod,
            ];

            colX = itemX;

            row.forEach((text, i) => {
                doc.text(text, colX, rowY, {
                    width: headers[i].width,
                    align: 'left',
                });
                colX += headers[i].width;
            });

            rowY += 20;

            // Check for page break
            if (rowY > doc.page.height - 50) {
                doc.addPage();
                rowY = 50; // Reset row position for new page
            }
        });

        // Finalize PDF
        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating PDF');
    }
};


exports.downloadSalesReportExcel = async (req, res) => {
    const { startDate, endDate, filter } = req.query;

    let filterDates = {};
    const now = new Date();

    // Apply filters
    if (filter === "day") {
        filterDates.startDate = new Date(now.setDate(now.getDate() - 1));
        filterDates.endDate = new Date();
    } else if (filter === "week") {
        filterDates.startDate = new Date(now.setDate(now.getDate() - 7));
        filterDates.endDate = new Date();
    } else if (filter === "month") {
        filterDates.startDate = new Date(now.setMonth(now.getMonth() - 1));
        filterDates.endDate = new Date();
    } else if (startDate && endDate) {
        filterDates.startDate = new Date(startDate);
        filterDates.endDate = new Date(endDate);
    }

    try {
        // Fetch data from the database
        const orders = await Order.aggregate([
            { $unwind: "$items" },
            {
                $match: {
                    "items.paymentStatus": "paid",
                    createdAt: {
                        $gte: filterDates.startDate || new Date(0),
                        $lte: filterDates.endDate || new Date(),
                    },
                },
            },
            {
                $group: {
                    _id: "$_id",
                    orderId: { $first: "$orderId" },
                    userId: { $first: "$userId" },
                    createdAt: { $first: "$createdAt" },
                    totalAmount: { $sum: "$items.itemTotal" },
                    couponDiscount: { $first: "$couponDiscount" },
                    totalDiscount: {
                        $sum: {
                            $add: [
                                { $subtract: ["$items.originalPrice", "$items.price"] },
                                { $ifNull: ["$couponDiscount", 0] },
                            ],
                        },
                    },
                    totalProductsSold: { $sum: "$items.quantity" },
                    paymentMethod: { $first: "$paymentMethod" },
                },
            },
            { $sort: { createdAt: -1 } },
        ]);

        // Prepare summary data
        const totalOrders = orders.length;
        const totalSalesAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalDiscount = orders.reduce((sum, order) => sum + order.totalDiscount, 0);
        const totalProductsSold = orders.reduce((sum, order) => sum + order.totalProductsSold, 0);

        // Create a new Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Set column headers
        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 20 },
            { header: 'User ID', key: 'userId', width: 20 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Discount', key: 'discount', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 },
        ];

        // Add "LapMart Sales Report" heading
        worksheet.mergeCells('A1:F1');
        worksheet.getCell('A1').value = 'LapMart Sales Report';
        worksheet.getCell('A1').font = { bold: true, size: 16 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };
        worksheet.addRow([]); // Empty row

        // Add summary information
        worksheet.addRow([`Total Orders: ${totalOrders}`, '', '', '', '', '']);
        worksheet.addRow([`Total Sales Amount: $${totalSalesAmount.toFixed(2)}`, '', '', '', '', '']);
        worksheet.addRow([`Total Discount: $${totalDiscount.toFixed(2)}`, '', '', '', '', '']);
        worksheet.addRow([`Total Products Sold: ${totalProductsSold}`, '', '', '', '', '']);
        worksheet.addRow([]); // Empty row to separate summary from the table

        // Add table header
        worksheet.addRow([
            'Order ID', 'User ID', 'Date', 'Amount', 'Discount', 'Payment Method'
        ]);

        // Add table rows for each order
        orders.forEach(order => {
            worksheet.addRow({
                orderId: order.orderId,
                userId: order.userId,
                date: moment(order.createdAt).format('YYYY-MM-DD'),
                amount: `$${order.totalAmount.toFixed(2)}`,
                discount: `$${order.totalDiscount.toFixed(2)}`,
                paymentMethod: order.paymentMethod,
            });
        });

        // Apply table formatting (bold header, borders, center alignment)
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { horizontal: 'center' };
        worksheet.getRow(1).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
            bottom: { style: 'thin' },
        };

        worksheet.eachRow((row, rowNumber) => {
            row.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
                bottom: { style: 'thin' },
            };
            if (rowNumber === 1) return; // Skip the header row
            row.alignment = { horizontal: 'center' };
        });

        // Set headers to be bold and centered
        worksheet.getRow(1).font = { bold: true };
        worksheet.columns.forEach(column => {
            column.alignment = { horizontal: 'center' };
        });

        // Generate the Excel file and send it to the user
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Sales_Report_${Date.now()}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating Excel report');
    }
};
