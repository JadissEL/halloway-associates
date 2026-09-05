import { prisma } from "@/lib/db/client";
import type { RequestRoomStatus, RequestRoomType } from "@prisma/client";

// The single "one notification system" entry point (spec section 10/11.2):
// every workflow state transition, regardless of vertical, goes through
// here so StatusEvent (Request Room timeline) and Notification (Communication
// Center) can never drift out of sync with each other.
const STATUS_MESSAGES: Partial<Record<RequestRoomType, Partial<Record<RequestRoomStatus, string>>>> = {
  LAWYER: {
    REQUESTED: "Your lawyer request has been received.",
    UNDER_REVIEW: "Your lawyer request is being reviewed.",
    MATCHING: "We're matching you with a suitable lawyer.",
    PROFESSIONAL_SELECTED: "We found a lawyer for your request.",
    APPOINTMENT_PENDING: "Your consultation is being scheduled.",
    CONFIRMED: "Your consultation is confirmed.",
    COMPLETED: "Your lawyer request has been completed.",
  },
  ARRIVAL_CALL: {
    CONFIRMED: "Your call is confirmed.",
    COMPLETED: "Your call has taken place.",
    CANCELLED: "Your call was cancelled.",
  },
  PROPERTY_SEARCH: {
    REQUESTED: "Your property search request has been received.",
  },
};

function defaultMessage(status: RequestRoomStatus): string {
  return `Your request status changed to ${status.replace(/_/g, " ").toLowerCase()}.`;
}

export async function emitStatusChange(
  roomId: string,
  fromStatus: RequestRoomStatus | null,
  toStatus: RequestRoomStatus,
  note?: string,
): Promise<void> {
  const room = await prisma.requestRoom.update({
    where: { id: roomId },
    data: { status: toStatus },
  });

  await prisma.statusEvent.create({
    data: { roomId, fromStatus, toStatus, note },
  });

  const message = STATUS_MESSAGES[room.type]?.[toStatus] ?? defaultMessage(toStatus);

  await prisma.notification.create({
    data: { userId: room.userId, requestRoomId: roomId, message },
  });
}
