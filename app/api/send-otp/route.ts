import { NextResponse } from 'next/server';

function formatPhoneNumber(phone: string): string | null {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid BD number length
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    return `88${cleaned}`;
  } else if (cleaned.length === 13 && cleaned.startsWith('8801')) {
    return cleaned;
  } else if (cleaned.length === 10 && cleaned.startsWith('1')) {
    return `880${cleaned}`;
  }
  
  return null;
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const formattedPhone = formatPhoneNumber(phone);

    if (!formattedPhone) {
      return NextResponse.json({ error: 'Invalid Bangladeshi phone number' }, { status: 400 });
    }

    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // In a real app, you would store this OTP in a database (like Supabase) with an expiration time
    // For now, we'll just simulate sending it.
    
    // BulkSMSNet API Integration
    const apiKey = process.env.BULKSMS_API_KEY;
    const senderId = '8809617618452';
    const message = `Your DjMC 35 OTP is ${otp}`;

    if (!apiKey) {
      console.warn('BULKSMS_API_KEY is not set. Simulating OTP send.', { otp, formattedPhone });
      // Return success for testing if API key is not set
      return NextResponse.json({ success: true, formattedPhone, simulatedOtp: otp });
    }

    const apiUrl = new URL('http://bulksmsbd.net/api/smsapi');
    apiUrl.searchParams.append('api_key', apiKey);
    apiUrl.searchParams.append('type', 'text');
    apiUrl.searchParams.append('number', formattedPhone);
    apiUrl.searchParams.append('senderid', senderId);
    apiUrl.searchParams.append('message', message);

    const response = await fetch(apiUrl.toString());
    const data = await response.text(); // BulkSMSBD often returns plain text or simple JSON

    // Check if it's a success response from BulkSMSBD
    if (data.includes('202') || data.includes('Success')) {
      return NextResponse.json({ success: true, formattedPhone, otp });
    } else {
      console.error('BulkSMS API Error:', data);
      return NextResponse.json({ error: 'Failed to send OTP via SMS provider' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
