

function validateDates(req, res, next) {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).send('Start date and end date are required.');
    }
    next();
}
module.exports = validateDates;
