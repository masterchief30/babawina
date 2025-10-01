/**
 * Script to create the temp_entries table in Supabase
 * Run this with: node scripts/create-temp-entries-table.js
 */

const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key, not anon key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTempEntriesTable() {
  console.log('🚀 Creating temp_entries table...')
  
  try {
    // Create the table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS temp_entries (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            session_id TEXT NOT NULL,
            competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
            competition_title TEXT NOT NULL,
            prize_short TEXT NOT NULL,
            entry_price INTEGER NOT NULL,
            entries_data JSONB NOT NULL,
            image_url TEXT NOT NULL,
            user_email TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            UNIQUE(session_id, competition_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_temp_entries_session_id ON temp_entries(session_id);
        CREATE INDEX IF NOT EXISTS idx_temp_entries_user_email ON temp_entries(user_email);
        CREATE INDEX IF NOT EXISTS idx_temp_entries_expires_at ON temp_entries(expires_at);
        
        ALTER TABLE temp_entries ENABLE ROW LEVEL SECURITY;
      `
    })

    if (createError) {
      console.error('❌ Error creating table:', createError)
      return false
    }

    console.log('✅ temp_entries table created successfully!')
    
    // Test the table by inserting a dummy record and then deleting it
    const testData = {
      session_id: 'test_session_123',
      competition_id: '00000000-0000-0000-0000-000000000000', // This will fail FK constraint, but that's OK for testing table structure
      competition_title: 'Test Competition',
      prize_short: 'Test Prize',
      entry_price: 500,
      entries_data: [{ id: 'test', x: 50, y: 50, timestamp: Date.now() }],
      image_url: 'https://example.com/test.jpg',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    console.log('🧪 Testing table structure...')
    const { error: testError } = await supabase
      .from('temp_entries')
      .insert(testData)

    if (testError) {
      // Expected to fail due to FK constraint, but if it's a structure error, we need to know
      if (testError.message.includes('violates foreign key constraint')) {
        console.log('✅ Table structure test passed (FK constraint working as expected)')
      } else {
        console.error('❌ Table structure test failed:', testError)
        return false
      }
    } else {
      // If it succeeded, clean up the test data
      await supabase
        .from('temp_entries')
        .delete()
        .eq('session_id', 'test_session_123')
      console.log('✅ Table structure test passed')
    }

    console.log('🎉 Database migration completed successfully!')
    console.log('   The entry preservation system is now fully functional.')
    
    return true
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

// Run the migration
createTempEntriesTable()
  .then(success => {
    if (success) {
      console.log('\n✅ Migration completed successfully!')
      console.log('   You can now test the full entry preservation flow.')
    } else {
      console.log('\n❌ Migration failed!')
      console.log('   The system will still work with localStorage only.')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Script error:', error)
    process.exit(1)
  })
