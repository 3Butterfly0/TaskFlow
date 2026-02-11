/**
 * Standard success response wrapper.
 *
 * Usage inside a controller:
 *   res.status(200).json(new ApiResponse(200, data, "Fetched successfully"));
 */
class ApiResponse {
  /**
   * @param {number} statusCode – HTTP status code
   * @param {*}      data       – Payload to return
   * @param {string} message    – Human-readable description
   */
  constructor(statusCode, data, message = "Success") {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
  }
}

export default ApiResponse;
