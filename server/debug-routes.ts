// Debug route to test meeting creation
import { insertMeetingSchema } from "@shared/schema";

export function debugMeetingData(data: any) {
  console.log('=== DEBUGGING MEETING CREATION ===');
  console.log('Raw input data:', JSON.stringify(data, null, 2));
  
  try {
    const validated = insertMeetingSchema.parse(data);
    console.log('✅ Validation successful:', JSON.stringify(validated, null, 2));
    return { success: true, data: validated };
  } catch (error: any) {
    console.log('❌ Validation failed:', error.message);
    console.log('Validation errors:', error.errors || error);
    return { success: false, error: error.message, details: error.errors || error };
  }
}