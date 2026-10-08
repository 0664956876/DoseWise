import { supabase } from './supabase';

type Medication = {
  id: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
};

type Schedule = {
  id: string;
  medication_id: string;
  dose_time: string;
  is_active: boolean;
  medications: Medication | null;
};

const MISSED_DOSE_GRACE_MINUTES = 60;

function getLocalDateString(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function createScheduledDate(
  doseTime: string
) {
  const [hours, minutes] = doseTime
    .slice(0, 5)
    .split(':')
    .map(Number);

  const scheduledDate = new Date();

  scheduledDate.setHours(
    hours,
    minutes,
    0,
    0
  );

  return scheduledDate;
}

export async function processMissedDoses() {
  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const user = userData.user;

  if (!user) {
    throw new Error(
      'Your session has expired.'
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from('medication_schedules')
    .select(`
      id,
      medication_id,
      dose_time,
      is_active,
      medications (
        id,
        start_date,
        end_date,
        is_active
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) {
    throw error;
  }

  const schedules = (data ?? [])
    .map((item: any) => ({
      ...item,

      medications: Array.isArray(
        item.medications
      )
        ? item.medications[0] ?? null
        : item.medications,
    }))
    .filter(
      (item: any) =>
        item.medications?.id
    ) as Schedule[];

  const now = new Date();

  const today =
    getLocalDateString(now);

  let recordedCount = 0;

  for (const schedule of schedules) {
    const medication =
      schedule.medications;

    if (!medication) {
      continue;
    }

    if (!medication.is_active) {
      continue;
    }

    if (
      medication.start_date &&
      today < medication.start_date
    ) {
      continue;
    }

    if (
      medication.end_date &&
      today > medication.end_date
    ) {
      continue;
    }

    const scheduledDate =
      createScheduledDate(
        schedule.dose_time
      );

    const missedAfter = new Date(
      scheduledDate.getTime() +
        MISSED_DOSE_GRACE_MINUTES *
          60 *
          1000
    );

    if (now < missedAfter) {
      continue;
    }

    const {
      data: inserted,
      error: missedDoseError,
    } = await supabase.rpc(
      'record_missed_dose',
      {
        p_medication_id:
          schedule.medication_id,

        p_schedule_id:
          schedule.id,

        p_scheduled_for:
          scheduledDate.toISOString(),
      }
    );

    if (missedDoseError) {
      console.error(
        'Missed dose processing error:',
        missedDoseError.message
      );

      continue;
    }

    if (inserted === true) {
      recordedCount += 1;
    }
  }

  return recordedCount;
}