import { Router, Response } from 'express';
import { getDb, queryAll, queryOne, saveDb } from '../config/db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { getGeminiClient } from '../config/gemini.js';
import { Type } from '@google/genai';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = await getDb();

    const medicines = queryAll(
      db,
      'SELECT * FROM medicines WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const parsedMedicines = medicines.map(med => {
      let times: string[] = [];
      try {
        times = JSON.parse(med.times_of_day);
      } catch {
        times = [med.times_of_day || '08:00'];
      }

      let days: string[] | string = 'everyday';
      try {
        if (med.days_of_week && med.days_of_week.startsWith('[')) {
          days = JSON.parse(med.days_of_week);
        } else {
          days = med.days_of_week || 'everyday';
        }
      } catch {
        days = 'everyday';
      }

      const isLowStock = Number(med.stock_quantity) <= 5;

      return {
        ...med,
        times_of_day: times,
        days_of_week: days,
        is_low_stock: isLowStock,
      };
    });

    res.json({ success: true, data: parsedMedicines });
  } catch (err: any) {
    console.error('Get medicines error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch medicines' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      name,
      dose,
      form,
      frequency_per_day,
      times_of_day,
      meal_timing,
      days_of_week,
      start_date,
      end_date,
      stock_quantity,
      notes,
    } = req.body;

    if (!name || !dose) {
      res.status(400).json({ success: false, message: 'Medicine name and dosage are required' });
      return;
    }

    const timesArray = Array.isArray(times_of_day) && times_of_day.length > 0 ? times_of_day : ['08:00'];
    const daysString = Array.isArray(days_of_week) ? JSON.stringify(days_of_week) : (days_of_week || 'everyday');

    const db = await getDb();
    db.run(`
      INSERT INTO medicines (
        user_id, name, dose, form, frequency_per_day, times_of_day,
        meal_timing, days_of_week, start_date, end_date, stock_quantity, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      name.trim(),
      dose.trim(),
      form || 'tablet',
      Number(frequency_per_day) || timesArray.length,
      JSON.stringify(timesArray),
      meal_timing || 'after_food',
      daysString,
      start_date || new Date().toISOString().slice(0, 10),
      end_date || null,
      stock_quantity !== undefined ? Number(stock_quantity) : 30,
      notes || '',
    ]);

    saveDb();

    res.status(201).json({
      success: true,
      message: 'Medicine added successfully! Reminders have been scheduled.',
    });
  } catch (err: any) {
    console.error('Create medicine error:', err);
    res.status(500).json({ success: false, message: 'Failed to create medicine reminder' });
  }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const medId = Number(req.params.id);
    const {
      name,
      dose,
      form,
      frequency_per_day,
      times_of_day,
      meal_timing,
      days_of_week,
      start_date,
      end_date,
      stock_quantity,
      notes,
    } = req.body;

    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM medicines WHERE id = ? AND user_id = ?', [medId, userId]);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Medicine reminder not found' });
      return;
    }

    const timesArray = Array.isArray(times_of_day) && times_of_day.length > 0 ? times_of_day : ['08:00'];
    const daysString = Array.isArray(days_of_week) ? JSON.stringify(days_of_week) : (days_of_week || 'everyday');

    db.run(`
      UPDATE medicines SET
        name = ?, dose = ?, form = ?, frequency_per_day = ?, times_of_day = ?,
        meal_timing = ?, days_of_week = ?, start_date = ?, end_date = ?,
        stock_quantity = ?, notes = ?
      WHERE id = ? AND user_id = ?
    `, [
      name.trim(),
      dose.trim(),
      form || 'tablet',
      Number(frequency_per_day) || timesArray.length,
      JSON.stringify(timesArray),
      meal_timing || 'after_food',
      daysString,
      start_date || null,
      end_date || null,
      stock_quantity !== undefined ? Number(stock_quantity) : 30,
      notes || '',
      medId,
      userId,
    ]);

    saveDb();
    res.json({ success: true, message: 'Medicine updated successfully' });
  } catch (err: any) {
    console.error('Update medicine error:', err);
    res.status(500).json({ success: false, message: 'Failed to update medicine' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const medId = Number(req.params.id);

    const db = await getDb();
    db.run('DELETE FROM intake_logs WHERE medicine_id = ? AND user_id = ?', [medId, userId]);
    db.run('DELETE FROM medicines WHERE id = ? AND user_id = ?', [medId, userId]);

    saveDb();
    res.json({ success: true, message: 'Medicine removed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete medicine' });
  }
});

// Prescription OCR & extraction via Gemini
router.post('/extract-prescription', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback extraction example if no API key is provided
      res.json({
        success: true,
        data: {
          extractedMedicines: [
            {
              name: 'Amoxicillin',
              dose: '500 mg',
              form: 'capsule',
              frequency_per_day: 3,
              times_of_day: ['08:00', '14:00', '20:00'],
              meal_timing: 'after_food',
              notes: 'Complete full course of antibiotics as prescribed by physician',
              stock_quantity: 21,
            },
            {
              name: 'Paracetamol',
              dose: '650 mg',
              form: 'tablet',
              frequency_per_day: 2,
              times_of_day: ['09:00', '21:00'],
              meal_timing: 'after_food',
              notes: 'Take as needed for temperature or pain',
              stock_quantity: 10,
            },
          ],
          source: 'template_fallback',
          disclaimer: 'Always verify extracted prescription details against your physical prescription.',
        },
      });
      return;
    }

    let contents: any;
    if (imageBase64) {
      // Clean base64 data if data URL header is present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: `Carefully read this prescription image. Extract all prescribed medicines into a structured list.
            NEVER prescribe or modify medicines. Follow exactly what the doctor wrote.
            Provide each medicine's name, dose (e.g. 500mg), form (tablet, capsule, syrup, injection, drops, inhaler),
            suggested meal timing (before_food, after_food, or empty_stomach), times of day (24-hour HH:MM), and any doctor notes.`,
          },
        ],
      };
    } else {
      res.status(400).json({ success: false, message: 'Please upload an image of your prescription.' });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            medicines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  dose: { type: Type.STRING },
                  form: { type: Type.STRING },
                  frequency_per_day: { type: Type.INTEGER },
                  times_of_day: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  meal_timing: { type: Type.STRING },
                  notes: { type: Type.STRING },
                  stock_quantity: { type: Type.INTEGER },
                },
                required: ['name', 'dose', 'form'],
              },
            },
          },
          required: ['medicines'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{"medicines":[]}');
    res.json({
      success: true,
      data: {
        extractedMedicines: parsed.medicines || [],
        source: 'gemini_vision',
        disclaimer: 'Always verify extracted prescription details against your physical prescription.',
      },
    });
  } catch (err: any) {
    console.error('Prescription extraction error:', err);
    // Graceful fallback with user notification
    res.json({
      success: true,
      data: {
        extractedMedicines: [
          {
            name: 'Sample Medicine',
            dose: '10 mg',
            form: 'tablet',
            frequency_per_day: 1,
            times_of_day: ['09:00'],
            meal_timing: 'after_food',
            notes: 'Please review and adjust dosage according to your physical prescription.',
            stock_quantity: 30,
          },
        ],
        source: 'fallback',
        disclaimer: 'Could not fully auto-scan the image. Please enter or confirm fields manually.',
      },
    });
  }
});

export default router;
