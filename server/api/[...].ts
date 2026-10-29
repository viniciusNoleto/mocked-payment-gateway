import { defineApiHandler, ApiError } from '../utils/api';
import { EApiCode } from '#shared/constants/apiCode';

export default defineApiHandler(() => {
  throw new ApiError(404, EApiCode.ROUTE_NOT_FOUND);
});
