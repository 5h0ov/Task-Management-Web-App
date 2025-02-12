// at first thought to use jose for the whole authentication but later scrapped and used zustand checkUser() instead

import { SignJWT, jwtVerify, JWTPayload as JoseJWTPayload } from 'jose';
// import { NextRequest } from 'next/server';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const alg = 'HS256';

export async function createToken(payload: JWTPayload) {
  console.log("payload:", payload);

  return await new SignJWT(payload as JoseJWTPayload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("12d")
    .sign(secret);
}


interface JWTPayload extends JoseJWTPayload {
  id: string;
  email: string;
  name: string;
}


export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error: unknown) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// below is TBD

// export async function getUser(request: NextRequest) {

//   const token = request.cookies.get('token')?.value;

//   console.log('token:', token);
//   if (!token) return null;

//   try {
//     let payload = await verifyToken(token);
//     console.log('payload:', payload);

//     payload = { 
//       user: payload,
//       token
//     }
    
//     return payload;
//   } catch (error: unknown) {
//     return null;
//   }
// }
