import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    // Validate authentication
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user || !user.email) {
      console.log('❌ Unauthorized filter options API access attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ Authenticated filter options request from:', user.email);

    // Read both filter_options_part_001.json and filter_options_part_002.json
    const filePath1 = join(process.cwd(), 'source_data.cursorignore', 'filter_options_part_001.json');
    const filePath2 = join(process.cwd(), 'source_data.cursorignore', 'filter_options_part_002.json');
    try {
      const fileContent1 = readFileSync(filePath1, 'utf8');
      const fileContent2 = readFileSync(filePath2, 'utf8');
      const data1 = JSON.parse(fileContent1);
      const data2 = JSON.parse(fileContent2);

      // Merge logic: concatenate combinations, merge filters (union of keys, deduplicate values)
      const mergedFilters = { ...data1.filters };
      for (const key of Object.keys(data2.filters || {})) {
        if (mergedFilters[key]) {
          mergedFilters[key] = Array.from(new Set([...(mergedFilters[key] || []), ...(data2.filters[key] || [])]));
        } else {
          mergedFilters[key] = data2.filters[key];
        }
      }
      const mergedCombinations = [
        ...(data1.combinations || []),
        ...(data2.combinations || [])
      ];

      const mergedData = {
        filters: mergedFilters,
        combinations: mergedCombinations
      };

      console.log(`✅ Successfully loaded and merged filter options from both parts (${mergedCombinations.length} combinations)`);
      return NextResponse.json(mergedData);
    } catch (fileError) {
      console.error('Error reading filter options files:', fileError);
      return NextResponse.json({ error: "Failed to load filter options" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in filter options API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 