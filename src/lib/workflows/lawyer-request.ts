import { prisma } from "@/lib/db/client";
import { emitStatusChange } from "./status-events";

export interface LawyerRequestInput {
  category: string;
  situation: string;
  consultationMode?: string;
  availability?: string;
  language?: string;
  paymentPreference?: string;
  additionalInfo?: string;
}

// Shared by both the AI tool (create_lawyer_request) and the traditional
// 8-step form at /professionals/lawyer — spec section 5.6: AI and
// traditional browsing must lead into the exact same underlying workflow.
export async function createLawyerRequestRoom(userId: string, input: LawyerRequestInput) {
  const room = await prisma.requestRoom.create({
    data: {
      userId,
      type: "LAWYER",
      status: "REQUESTED",
      structuredData: { ...input },
    },
  });
  try {
    await emitStatusChange(room.id, null, "REQUESTED", "Lawyer request submitted.");
  } catch (error) {
    // The RequestRoom row is already committed above; a notification/timeline
    // hiccup here must not surface as a request failure to the caller.
    console.error("emitStatusChange failed after lawyer request room committed", error);
  }
  return room;
}
