/**
 * Zod Schemas
 *
 * 모든 유효성 검사 스키마 중앙 export
 */

// User Schemas
export {
  // Enums
  GenderSchema,
  RankSchema,
  SpecialtySchema,
  // User
  UserSchema,
  ProfileUpdateSchema,
  // Signup
  PassVerificationSchema,
  MilitaryInfoSchema,
  SignupCompleteSchema,
  // Helpers
  safeParse,
  parse,
  formatZodErrors,
} from './user.schema';

export type {
  UserSchemaType,
  ProfileUpdateSchemaType,
  PassVerificationSchemaType,
  MilitaryInfoSchemaType,
  SignupCompleteSchemaType,
} from './user.schema';

// API Schemas
export {
  ApiErrorResponseSchema,
  PaginationMetaSchema,
  GetCurrentUserResponseSchema,
  GetUserProfileResponseSchema,
  CheckNicknameResponseSchema,
  ProfileSearchResponseSchema,
  RecommendedProfilesResponseSchema,
  ImageUploadResponseSchema,
  ImageDeleteResponseSchema,
  parseApiResponse,
  safeParseApiResponse,
} from './api.schema';

export type { ApiErrorResponseSchemaType } from './api.schema';

// Routine Schemas
export {
  // Enums
  SessionPurposeSchema,
  EventTypeSchema,
  EventStatusSchema,
  EventSourceSchema,
  ChatRoleSchema,
  ExerciseCategorySchema,
  WorkoutTypeSchema,
  // Workout Details
  WorkoutSetSchema,
  WorkoutExerciseSchema,
  WorkoutDataSchema,
  // Chat
  ChatMessageSchema,
  // Event
  RoutineEventSchema,
  RoutineEventCreateSchema,
  RoutineEventUpdateSchema,
  RoutineBatchCreateSchema,
  // Query Params
  EventQueryParamsSchema,
} from './routine.schema';

export type {
  SessionPurposeSchemaType,
  EventTypeSchemaType,
  EventStatusSchemaType,
  WorkoutSetSchemaType,
  WorkoutExerciseSchemaType,
  WorkoutDataSchemaType,
  ChatMessageSchemaType,
  RoutineEventSchemaType,
  RoutineEventCreateSchemaType,
  RoutineBatchCreateSchemaType,
  EventQueryParamsSchemaType,
} from './routine.schema';
