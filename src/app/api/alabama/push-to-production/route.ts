import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceRole } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceRole();

    // First, get count of records in dev table
    const { count: devCount, error: devError } = await supabase
      .from('alabama_dev')
      .select('*', { count: 'exact', head: true });
    
    if (devError) {
      return NextResponse.json({ error: 'Failed to check development data' }, { status: 500 });
    }
    
    if (!devCount || devCount === 0) {
      return NextResponse.json({ error: 'No data in development table to push' }, { status: 400 });
    }
    
    // Clear production table
    const { error: deleteError } = await supabase
      .from('alabama_prod')
      .delete()
      .neq('id', 0);
    
    if (deleteError) {
      return NextResponse.json({ error: 'Failed to clear production table' }, { status: 500 });
    }
    
    // Get all data from dev table
    const { data: devData, error: fetchError } = await supabase
      .from('alabama_dev')
      .select('*');
    
    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch development data' }, { status: 500 });
    }
    
    // Insert all dev data into production
    const { error: insertError } = await supabase
      .from('alabama_prod')
      .insert(devData);
    
    if (insertError) {
      return NextResponse.json({ error: 'Failed to push data to production' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully pushed ${devData.length} records to production`,
      recordCount: devData.length
    });
    
  } catch (error) {
    console.error('Push to production error:', error);
    return NextResponse.json({ error: 'Failed to push data to production' }, { status: 500 });
  }
}

