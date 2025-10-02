import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceRole } from '../../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceRole();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const table = searchParams.get('table') || 'dev'; // 'dev' or 'prod'
    const search = searchParams.get('search') || '';
    const serviceCategory = searchParams.get('service_category') || '';
    
    const tableName = table === 'prod' ? 'alabama_prod' : 'alabama_dev';
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase.from(tableName).select('*', { count: 'exact' });
    
    // Add search filters
    if (search) {
      query = query.or(`service_code.ilike.%${search}%,service_description.ilike.%${search}%,service_category.ilike.%${search}%`);
    }
    
    if (serviceCategory) {
      query = query.eq('service_category', serviceCategory);
    }
    
    // Add pagination
    query = query.range(offset, offset + limit - 1).order('id', { ascending: true });
    
    const { data, error, count } = await query;
    
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
    
    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('Data fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceRole();

    const { id, table, ...updateData } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }
    
    const tableName = table === 'prod' ? 'alabama_prod' : 'alabama_dev';
    
    const { data, error } = await supabase
      .from(tableName)
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    
    if (error) {
      return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: data[0] });
    
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceRole();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const table = searchParams.get('table') || 'dev';
    
    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }
    
    const tableName = table === 'prod' ? 'alabama_prod' : 'alabama_dev';
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}

