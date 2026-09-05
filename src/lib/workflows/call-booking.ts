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
  if (!slot || slot.isBooked) {
    return {
      error: "slot_unavailable",
      message: "That slot is no longer available. Please pick another one.",
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.availabilitySlot.update({ where: { id: input.slotId }, data: { isBooked: true } });
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

  await emitStatusChange(result.room.id, null, "CONFIRMED", "Call booked.");
  return { bookingId: result.booking.id, roomId: result.room.id, slotStart: slot.startTime };
}
