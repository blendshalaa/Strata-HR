/**
 * Input Validation Middleware
 * Reusable validation schemas for all major endpoints using express-validator.
 */
const { body, param, query, validationResult } = require('express-validator');

// Generic handler that checks for validation errors and returns 400 if any
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
    }
    next();
};

// --- Auth Schemas ---

const registerRules = [
    body('email').isEmail().withMessage('Must be a valid email address').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
    body('department').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
    body('hire_date').optional({ checkFalsy: true }).isISO8601().withMessage('Hire date must be a valid date (YYYY-MM-DD)'),
    body('org_name').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
    body('invite_code').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
];

const loginRules = [
    body('email').isEmail().withMessage('Must be a valid email address').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
];

// --- Leave Schemas ---

const leaveRequestRules = [
    body('type').isIn(['sick', 'vacation', 'personal']).withMessage('Type must be sick, vacation, or personal'),
    body('start_date').isISO8601().withMessage('Start date must be a valid date'),
    body('end_date').isISO8601().withMessage('End date must be a valid date'),
    body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason too long (max 500 chars)'),
];

const leaveStatusRules = [
    param('id').isInt({ min: 1 }).withMessage('Invalid leave request ID'),
    body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
];

// --- Attendance Schemas ---

const timesheetStatusRules = [
    param('id').isInt({ min: 1 }).withMessage('Invalid timesheet ID'),
    body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
];

// --- Recruitment Schemas ---

const createJobRules = [
    body('title').trim().notEmpty().withMessage('Job title is required').isLength({ max: 200 }),
    body('description').trim().notEmpty().withMessage('Job description is required'),
    body('department_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Invalid department ID'),
    body('requirements').optional().trim(),
    body('status').optional().isIn(['open', 'closed']).withMessage('Status must be open or closed'),
];

const applicationStatusRules = [
    param('id').isInt({ min: 1 }).withMessage('Invalid application ID'),
    body('status').isIn(['applied', 'interviewing', 'hired', 'rejected']).withMessage('Invalid application status'),
];

const submitApplicationRules = [
    param('jobId').isInt({ min: 1 }).withMessage('Invalid job ID'),
    body('applicant_name').trim().notEmpty().withMessage('Applicant name is required'),
    body('email').isEmail().withMessage('Must be a valid email address').normalizeEmail(),
];

// --- Payroll Schemas ---

const createPayrollRules = [
    body('user_id').isInt({ min: 1 }).withMessage('Employee ID is required'),
    body('base_salary').isFloat({ min: 0 }).withMessage('Base salary must be a positive number'),
    body('bonus').optional().isFloat({ min: 0 }).withMessage('Bonus must be a positive number'),
    body('tax_deduction').optional().isFloat({ min: 0 }).withMessage('Tax deduction must be a positive number'),
    body('pay_period_start').isISO8601().withMessage('Pay period start must be a valid date'),
    body('pay_period_end').isISO8601().withMessage('Pay period end must be a valid date'),
];

// --- Performance Schemas ---

const createEvaluationRules = [
    body('user_id').isInt({ min: 1 }).withMessage('Employee ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comments').optional().trim().isLength({ max: 2000 }).withMessage('Comments too long (max 2000 chars)'),
];

// --- Department Schemas ---

const createDepartmentRules = [
    body('name').trim().notEmpty().withMessage('Department name is required').isLength({ max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
];

// --- Knowledge Schemas ---

const createKnowledgeRules = [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('category').optional().trim().isLength({ max: 50 }),
];

// --- User Management Schemas ---

const updateUserRules = [
    param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('department').optional().trim().isLength({ max: 100 }),
    body('role').optional().isIn(['employee', 'hr', 'admin']).withMessage('Role must be employee, hr, or admin'),
    body('sick_leave_balance').optional().isInt({ min: 0 }).withMessage('Sick leave balance must be >= 0'),
    body('vacation_balance').optional().isInt({ min: 0 }).withMessage('Vacation balance must be >= 0'),
];

module.exports = {
    validate,
    registerRules,
    loginRules,
    leaveRequestRules,
    leaveStatusRules,
    timesheetStatusRules,
    createJobRules,
    applicationStatusRules,
    submitApplicationRules,
    createPayrollRules,
    createEvaluationRules,
    createDepartmentRules,
    createKnowledgeRules,
    updateUserRules,
};
