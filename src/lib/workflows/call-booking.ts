import { prisma } from "@/lib/db/client";
import { emitStatusChange } from "./status-events";
import type { CallType } from "@prisma/client";

export interface CallBookingInput {
  callType: CallType;
  slotId: string;
  reason?: string;
  topics?: string[];
  preferredLanguage?: string;
  countryOfOrigin?: string;
  cityOfInterest?: string;
  arrivalDate?: Date;
}

export interface CallBookingError {
  error: "slot_unavailable";
  message: string;
}

// Shared by the AI tool (create_call_booking) and the traditional
// /book-a-call form — same underlying workflow either way (spec 5.6).
export async function bookCall(
  userId: string,
  input: CallBookingInput,
): Promise<{ bookingId: string; roomId: string; slotStart: Date } | CallBookingError> {
  const slot = await prisma.availabilitySlot.findUnique({ where: { id: input.slotId } });
  if (!slot) {
    return {
      error: "slot_unavailable",
      message: "That slot is no longer available. Please pick another one.",
    };
  }

  let result: { booking: { id: string }; room: { id: string } };
  try {
    result = await prisma.$transaction(async (tx) => {
      // Conditional update, not a plain set: two concurrent bookings for the
      // same slot can't both succeed — only the first `updateMany` actually
      // matches a row (isBooked: false), so the second throws and rolls back
      // instead of silently double-booking.
      const { count } = await tx.availabilitySlot.updateMany({
        where: { id: input.slotId, isBooked: false },
        data: { isBooked: true },
      });
      if (count === 0) {
        throw new Error("SLOT_ALREADY_BOOKED");
      }

      const booking = await tx.callBooking.create({
        data: {
          userId,
          callType: input.callType,
          reason: input.reason,
          topics: input.topics ?? [],
          preferredLanguage: input.preferredLanguage ?? "en",
          countryOfOrigin: input.countryOfOrigin,
          cityOfInterest: input.cityOfInterest,
          arrivalDate: input.arrivalDate,
          slotId: input.slotId,
        },
      });
      const room = await tx.requestRoom.create({
        data: {
          userId,
          type: "ARRIVAL_CALL",
          status: "CONFIRMED",
          callBookingId: booking.id,
          structuredData: { ...input, slotId: undefined },
        },
      });
      return { booking, room };
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_ALREADY_BOOKED") {
      return {
        error: "slot_unavailable",
        message: "That slot was just taken. Please pick another one.",
      };
    }
    throw error;
  }

  try {
    await emitStatusChange(result.room.id, null, "CONFIRMED", "Call booked.");
  } catch (error) {
    // The slot and booking are already committed above; a notification/timeline
    // hiccup here must not surface as a booking failure (that would invite a
    // retry and a real double-booking). Log and continue.
    console.error("emitStatusChange failed after call booking committed", error);
  }
  return { bookingId: result.booking.id, roomId: result.room.id, slotStart: slot.startTime };
}
