// utils/responseHelper.js

/**
 * Helper utility to standardize API responses across the application
 */

/**
 * Create a success response
 * @param {string} message - Success message
 * @param {object} data - Data to be returned
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {object} Standardized success response
 */
const successResponse = (message, data = {}, statusCode = 200) => {
    return {
      status: 'success',
      message,
      data,
      statusCode
    };
  };
  
  /**
   * Create an error response
   * @param {string} message - Error message
   * @param {string} code - Error code for client-side handling
   * @param {object} errors - Validation errors or additional error details
   * @param {number} statusCode - HTTP status code (default: 400)
   * @returns {object} Standardized error response
   */
  const errorResponse = (message, code = 'ERROR', errors = null, statusCode = 400) => {
    const response = {
      status: 'error',
      message,
      code,
      statusCode
    };
    
    if (errors) {
      response.errors = errors;
    }
    
    return response;
  };
  
  /**
   * Send a success response
   * @param {object} res - Express response object
   * @param {string} message - Success message
   * @param {object} data - Data to be returned
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  const sendSuccess = (res, message, data = {}, statusCode = 200) => {
    const response = successResponse(message, data);
    return res.status(statusCode).json(response);
  };
  
  /**
   * Send an error response
   * @param {object} res - Express response object
   * @param {string} message - Error message
   * @param {string} code - Error code for client-side handling
   * @param {object} errors - Validation errors or additional error details
   * @param {number} statusCode - HTTP status code (default: 400)
   */
  const sendError = (res, message, code = 'ERROR', errors = null, statusCode = 400) => {
    const response = errorResponse(message, code, errors);
    return res.status(statusCode).json(response);
  };
  
  /**
   * Create a validation error response
   * @param {object} validationErrors - Express-validator validation errors
   * @returns {object} Formatted validation errors
   */
  const formatValidationErrors = (validationErrors) => {
    const formattedErrors = {};
    
    validationErrors.array().forEach((error) => {
      formattedErrors[error.path] = error.msg;
    });
    
    return formattedErrors;
  };
  
  module.exports = {
    successResponse,
    errorResponse,
    sendSuccess,
    sendError,
    formatValidationErrors
  };