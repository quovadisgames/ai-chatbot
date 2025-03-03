import { compare } from 'bcrypt-ts';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    const users = await getUser(email);
    if (users.length === 0) return Response.json(null, { status: 401 });

    const user = users[0];
    if (!user.password) return Response.json(null, { status: 401 });

    const passwordsMatch = await compare(password, user.password);
    if (!passwordsMatch) return Response.json(null, { status: 401 });

    // Don't send password back
    const { password: _, ...userWithoutPassword } = user;
    return Response.json(userWithoutPassword);
  } catch (error) {
    return Response.json(null, { status: 500 });
  }
} 