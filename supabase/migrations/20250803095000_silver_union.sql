/*
  # Fix users table RLS policy

  1. Security Changes
    - Add INSERT policy for authenticated users to create their own user records
    - Allow users to insert records where the id matches their auth.uid()
    
  2. Notes
    - This fixes the "new row violates row-level security policy" error
    - Users can only insert records with their own user ID for security
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Allow user to create own profile" ON users;

-- Create new INSERT policy that allows authenticated users to insert their own records
CREATE POLICY "Allow authenticated users to insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);