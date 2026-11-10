import "server-only";
import { run, tx } from "./db";
import { hashPassword, randomToken } from "./auth";
import { addDays, todayIn } from "./format";

/** Fills an empty CRM with realistic sample data so every screen has something to show. */
export function seedDemoData(adminId: number, tz: string) {
  const today = todayIn(tz);
  tx(() => {
    const pw = hashPassword(randomToken(12)); // demo techs get random passwords; reset them on the Team page
    const techs = [
      ["Marco Bellini", "marco@example.com", "#2563eb"],
      ["Priya Nair", "priya@example.com", "#16a34a"],
      ["Dave Tremblay", "dave@example.com", "#db2777"],
    ].map(([name, email, color]) => run("INSERT OR IGNORE INTO users (name, email, role, color, password_hash) VALUES (?, ?, 'tech', ?, ?)", name, email, color, pw).id);

    const price: [string, string, string, string, number, number][] = [
      ["service", "", "Diagnostics", "Service call & diagnostic", 9900, 0],
      ["service", "", "Labour", "Repair labour (per hour)", 12500, 0],
      ["service", "Dishwasher", "Installation", "Dishwasher installation", 22900, 0],
      ["service", "Washer", "Installation", "Washer & dryer installation", 19900, 0],
      ["service", "Microwave", "Installation", "OTR microwave installation", 24900, 0],
      ["service", "Dryer", "Maintenance", "Dryer vent cleaning", 14900, 0],
      ["material", "Refrigerator", "Defrost", "Defrost thermostat", 6500, 2200],
      ["material", "Refrigerator", "Water", "Water inlet valve", 7900, 2700],
      ["material", "Refrigerator", "Cooling", "Evaporator fan motor", 12900, 4900],
      ["material", "Dishwasher", "Drain", "Drain pump", 14500, 6100],
      ["material", "Dishwasher", "Door", "Door gasket", 6900, 2400],
      ["material", "Washer", "Door", "Door boot seal", 11900, 4800],
      ["material", "Washer", "Drain", "Drain pump", 10900, 4200],
      ["material", "Dryer", "Heating", "Heating element", 9800, 3600],
      ["material", "Dryer", "Drive", "Drum belt", 4900, 1500],
      ["material", "Oven", "Heating", "Bake element", 8900, 3100],
      ["material", "Oven", "Controls", "Temperature sensor", 7500, 2600],
    ];
    for (const [kind, appliance, cat, name, p, cost] of price) {
      run("INSERT INTO pricebook (kind, appliance, category, name, unit_price_cents, cost_cents) VALUES (?, ?, ?, ?, ?, ?)", kind, appliance, cat, name, p, cost);
    }

    const people: [string, string, string, string, string, string, string][] = [
      ["Sarah", "Mitchell", "sarah.m@example.com", "613-555-0142", "42 Elgin St", "Ottawa", "K2P 1L7"],
      ["James", "Okafor", "jokafor@example.com", "613-555-0178", "118 Bank St", "Ottawa", "K1P 5N6"],
      ["Linda", "Gagnon", "lgagnon@example.com", "819-555-0110", "9 Rue Laurier", "Gatineau", "J8X 3V8"],
      ["Tom", "Chen", "tchen@example.com", "613-555-0199", "2201 Riverside Dr", "Ottawa", "K1H 7X3"],
      ["Aisha", "Rahman", "aisha.r@example.com", "613-555-0133", "75 Kanata Ave", "Kanata", "K2T 1K5"],
      ["Robert", "Leblanc", "rleblanc@example.com", "613-555-0121", "560 Rideau St", "Ottawa", "K1N 6A4"],
      ["Emily", "Watson", "ewatson@example.com", "613-555-0165", "14 Greenbank Rd", "Nepean", "K2H 5V2"],
      ["Kevin", "Singh", "ksingh@example.com", "613-555-0187", "301 Innes Rd", "Orléans", "K1W 1K9"],
    ];
    const sources = ["Google", "Website", "Referral", "Google", "Facebook", "Website", "Repeat customer", "Google"];
    const cust = people.map(([f, l, email, phone, street, city, postal], i) => {
      const { id } = run(
        "INSERT INTO customers (first_name, last_name, email, phone, lead_source, tags) VALUES (?, ?, ?, ?, ?, ?)",
        f,
        l,
        email,
        phone,
        sources[i],
        i % 3 === 0 ? "VIP" : "",
      );
      const addr = run("INSERT INTO addresses (customer_id, street, city, province, postal_code) VALUES (?, ?, ?, 'ON', ?)", id, street, city, postal).id;
      return { id, addr };
    });

    let jobNo = 1001;
    let invNo = 2001;
    const job = (
      c: number,
      title: string,
      appliance: string,
      brand: string,
      dayOffset: number | null,
      hour: number,
      tech: number | null,
      status: string,
      items: [string, string, number, number][],
    ) => {
      const start = dayOffset === null ? null : `${addDays(today, dayOffset)}T${String(hour).padStart(2, "0")}:00`;
      const end = dayOffset === null ? null : `${addDays(today, dayOffset)}T${String(hour + 2).padStart(2, "0")}:00`;
      const { id } = run(
        `INSERT INTO jobs (number, customer_id, address_id, title, appliance, brand, scheduled_start, scheduled_end, tech_id, status, lead_source, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Google', ?)`,
        jobNo++,
        cust[c].id,
        cust[c].addr,
        title,
        appliance,
        brand,
        start,
        end,
        tech,
        status,
        status === "completed" ? new Date().toISOString() : null,
      );
      items.forEach(([kind, name, qty, cents], idx) =>
        run(
          "INSERT INTO line_items (parent_type, parent_id, kind, name, quantity, unit_price_cents, sort) VALUES ('job', ?, ?, ?, ?, ?, ?)",
          id,
          kind,
          name,
          qty,
          cents,
          idx,
        ),
      );
      run("INSERT INTO activities (customer_id, job_id, user_id, body) VALUES (?, ?, ?, ?)", cust[c].id, id, adminId, `Job created`);
      return id;
    };

    const diag: [string, string, number, number] = ["service", "Service call & diagnostic", 1, 9900];
    const done1 = job(0, "Fridge not cooling", "Refrigerator", "Samsung", -6, 9, techs[0], "completed", [diag, ["material", "Defrost thermostat", 1, 6500], ["service", "Repair labour (per hour)", 1, 12500]]);
    const done2 = job(1, "Dishwasher not draining", "Dishwasher", "Bosch", -4, 13, techs[1], "completed", [diag, ["material", "Dishwasher drain pump", 1, 14500], ["service", "Repair labour (per hour)", 1.5, 12500]]);
    const done3 = job(2, "Dryer not heating", "Dryer", "Whirlpool", -2, 10, techs[2], "completed", [diag, ["material", "Dryer heating element", 1, 9800]]);
    job(3, "Washer leaking from door", "Washer", "LG", 0, 9, techs[0], "in_progress", [diag]);
    job(4, "Oven won't heat", "Oven", "GE", 0, 13, techs[1], "dispatched", [diag]);
    job(5, "Install new dishwasher", "Dishwasher", "KitchenAid", 0, 15, techs[2], "scheduled", [["service", "Dishwasher installation", 1, 22900]]);
    job(6, "Range hood fan noisy", "Range hood", "Broan", 1, 10, techs[0], "scheduled", [diag]);
    job(7, "Microwave install over range", "Microwave", "Panasonic", 2, 11, techs[1], "scheduled", [["service", "OTR microwave installation", 1, 24900]]);
    job(0, "Ice maker not working", "Refrigerator", "Samsung", 3, 9, techs[2], "scheduled", [diag]);
    job(5, "Dryer vent cleaning", "Dryer", "Maytag", null, 0, null, "unscheduled", [["service", "Dryer vent cleaning", 1, 14900]]);
    job(3, "Fridge making clicking noise", "Refrigerator", "LG", null, 0, null, "unscheduled", []);

    const invoice = (jobId: number, c: number, issuedOffset: number) => {
      const issued = addDays(today, issuedOffset);
      const { id } = run(
        "INSERT INTO invoices (number, customer_id, job_id, status, token, issued_on, due_on) VALUES (?, ?, ?, 'sent', ?, ?, ?)",
        invNo++,
        cust[c].id,
        jobId,
        randomToken(),
        issued,
        addDays(issued, 7),
      );
      run(
        `INSERT INTO line_items (parent_type, parent_id, kind, name, quantity, unit_price_cents, taxable, sort)
         SELECT 'invoice', ?, kind, name, quantity, unit_price_cents, taxable, sort FROM line_items WHERE parent_type = 'job' AND parent_id = ?`,
        id,
        jobId,
      );
      return id;
    };
    const inv1 = invoice(done1, 0, -6);
    invoice(done2, 1, -4);
    const inv3 = invoice(done3, 2, -2);
    // Pay invoices in full using their real totals (13% HST on taxable lines).
    for (const [inv, method] of [
      [inv1, "card"],
      [inv3, "e-transfer"],
    ] as const) {
      run(
        `INSERT INTO payments (invoice_id, amount_cents, method, paid_on, recorded_by, token)
         SELECT ?, CAST(ROUND(SUM(quantity * unit_price_cents) * 1.13) AS INTEGER), ?, ?, ?, lower(hex(randomblob(16))) FROM line_items WHERE parent_type = 'invoice' AND parent_id = ?`,
        inv,
        method,
        addDays(today, -2),
        adminId,
        inv,
      );
    }

    const est = (c: number, title: string, status: string, items: [string, string, number, number][]) => {
      const { id } = run(
        "INSERT INTO estimates (number, customer_id, address_id, title, status, token, valid_until) VALUES ((SELECT COALESCE(MAX(number), 5000) + 1 FROM estimates), ?, ?, ?, ?, ?, ?)",
        cust[c].id,
        cust[c].addr,
        title,
        status,
        randomToken(),
        addDays(today, 30),
      );
      items.forEach(([kind, name, qty, cents], idx) =>
        run(
          "INSERT INTO line_items (parent_type, parent_id, kind, name, quantity, unit_price_cents, sort) VALUES ('estimate', ?, ?, ?, ?, ?, ?)",
          id,
          kind,
          name,
          qty,
          cents,
          idx,
        ),
      );
    };
    est(6, "Washer & dryer install", "sent", [["service", "Washer & dryer installation", 1, 19900]]);
    est(7, "Replace washer door seal", "approved", [["material", "Washer door boot seal", 1, 11900], ["service", "Repair labour (per hour)", 1, 12500]]);
    est(4, "Oven element replacement", "draft", [["material", "Oven bake element", 1, 8900], ["service", "Repair labour (per hour)", 1, 12500]]);
  });
}
