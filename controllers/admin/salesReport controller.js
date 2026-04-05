const Order=require('../../model/orderSchema');
const moment=require('moment');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Table } = require('pdfkit-table'); 
const messages = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');



exports.getSalesReport = async (req, res) => {
    const { startDate, endDate, filter } = req.query;

    let filterDates = {};
    const now = new Date();

   
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
                $lookup: {
                    from: "products", 
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },

          
            { $unwind: "$productDetails" },

            
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

        
        const totalOrders = orders.length;
        const totalSalesAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalDiscount = orders.reduce((sum, order) => sum + order.totalDiscount, 0);
        const totalProductsSold = orders.reduce((sum, order) => sum + order.totalProductsSold, 0);

       
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
          res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(messages.REPORT.LOAD_ERROR,);
    }
};

exports.downloadSalesReportPDF = async (req, res) => {
    const { startDate, endDate, filter } = req.query;

    let filterDates = {};
    const now = new Date();

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


        const totalOrders = orders.length;
        const totalSalesAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalDiscount = orders.reduce((sum, order) => sum + order.totalDiscount, 0);
        const totalProductsSold = orders.reduce((sum, order) => sum + order.totalProductsSold, 0);

        const doc = new PDFDocument({ margin: 30 });
        const filename = `Sales_Report_${Date.now()}.pdf`;

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);

        doc.fontSize(15).font('Helvetica-Bold').text('LapMart Sales Report', { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(14)
            .text(`Total Orders: ${totalOrders}`, { align: 'left' })
            .text(`Total Sales Amount: $${totalSalesAmount.toFixed(2)}`, { align: 'left' })
            .text(`Total Discount: $${totalDiscount.toFixed(2)}`, { align: 'left' })
            .text(`Total Products Sold: ${totalProductsSold}`, { align: 'left' });
        doc.moveDown(2);

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

        doc.fontSize(7).font('Helvetica-Bold');
        let colX = itemX;

        headers.forEach((header) => {
            doc.text(header.label, colX, tableTop, { width: header.width, align: 'left' });
            colX += header.width;
        });

        doc.moveTo(itemX, tableTop + 15)
            .lineTo(itemX + colX - itemX, tableTop + 15)
            .stroke();

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

            if (rowY > doc.page.height - 50) {
                doc.addPage();
                rowY = 50; 
            }
        });
        doc.end();
    } catch (err) {
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(
          messages.REPORT.PDF_ERROR
  );
    }
};


exports.downloadSalesReportExcel = async (req, res) => {
    const { startDate, endDate, filter } = req.query;

    let filterDates = {};
    const now = new Date();

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

        const totalOrders = orders.length;
        const totalSalesAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalDiscount = orders.reduce((sum, order) => sum + order.totalDiscount, 0);
        const totalProductsSold = orders.reduce((sum, order) => sum + order.totalProductsSold, 0);

        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

       
        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 20 },
            { header: 'User ID', key: 'userId', width: 20 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Discount', key: 'discount', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 },
        ];

        
        worksheet.mergeCells('A1:F1');
        worksheet.getCell('A1').value = 'LapMart Sales Report';
        worksheet.getCell('A1').font = { bold: true, size: 16 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };
        worksheet.addRow([]); // Empty row

      
        worksheet.addRow([`Total Orders: ${totalOrders}`, '', '', '', '', '']);
        worksheet.addRow([`Total Sales Amount: $${totalSalesAmount.toFixed(2)}`, '', '', '', '', '']);
        worksheet.addRow([`Total Discount: $${totalDiscount.toFixed(2)}`, '', '', '', '', '']);
        worksheet.addRow([`Total Products Sold: ${totalProductsSold}`, '', '', '', '', '']);
        worksheet.addRow([]); 

      
        worksheet.addRow([
            'Order ID', 'User ID', 'Date', 'Amount', 'Discount', 'Payment Method'
        ]);

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

        worksheet.getRow(1).font = { bold: true };
        worksheet.columns.forEach(column => {
            column.alignment = { horizontal: 'center' };
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Sales_Report_${Date.now()}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
         res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(
         messages.REPORT.EXCEL_ERROR
  ) ;
    }
};
