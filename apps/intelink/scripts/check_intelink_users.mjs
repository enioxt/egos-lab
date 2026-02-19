import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: members, error } = await supabase.from('intelink_unit_members').select('*');
    if (error) {
        console.error("Error fetching members:", error);
        process.exit(1);
    }

    console.log(`Found ${members.length} members:`);

    const phones = new Set();
    const names = new Set();
    const duplicates = [];

    for (const m of members) {
        if (phones.has(m.phone)) duplicates.push(`Phone dup: ${m.phone} (${m.name})`);
        if (names.has(m.name)) duplicates.push(`Name dup: ${m.name} (${m.phone})`);

        phones.add(m.phone);
        names.add(m.name);

        console.log(`- ${m.name} (${m.role} / ${m.system_role || 'member'}) - Phone: ${m.phone} - Created: ${m.created_at}`);
    }

    if (duplicates.length) {
        console.log("\n⚠️ Duplicates found:");
        console.log(duplicates.join("\n"));
    } else {
        console.log("\n✅ No obvious name/phone duplicates found.");
    }
}

check();
