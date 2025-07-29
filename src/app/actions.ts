
'use server';

import { caregiverRecommendation } from '@/ai/flows/caregiver-recommendation';
import type { CaregiverRecommendationInput, CaregiverRecommendationOutput } from '@/types/caregiver-types';
import { z } from 'zod';
import { Resend } from 'resend';
import { getAdminEmails } from '@/lib/settings';

// New type for the action input
type CareRecommendationRequest = CaregiverRecommendationInput & {
    userName: string;
    userPhone: string;
};

export async function getCaregiverRecommendations(request: CareRecommendationRequest): Promise<CaregiverRecommendationOutput> {
  const { userName, userPhone, ...caregiverInput } = request;

  // --- Step 1: Get recommendations first ---
  const result = await caregiverRecommendation(caregiverInput);

  // --- Step 2: If recommendations are found, THEN send the email ---
  if (result.recommendations.length > 0) {
      try {
        const resendApiKey = process.env.CARECONNECT_RESEND_API_KEY;
        if (!resendApiKey || resendApiKey.length < 5) {
            console.warn('[Email Action] Resend API 키가 .env.local 파일에 설정되지 않았습니다. 추천 요청 이메일을 보낼 수 없습니다.');
        } else {
            const adminEmails = await getAdminEmails();
            const resend = new Resend(resendApiKey);

            if (adminEmails && adminEmails.length > 0) {
                const fromEmail = process.env.CARECONNECT_EMAIL_FROM || 'onboarding@resend.dev';
                
                let requestedDatesText = '미지정';
                if (caregiverInput.requestedDateRange) {
                    const { from, to } = caregiverInput.requestedDateRange;
                    if (from && to && from !== to) {
                        requestedDatesText = `${from} ~ ${to}`;
                    } else if (from) {
                        requestedDatesText = from;
                    }
                }

                await resend.emails.send({
                    from: fromEmail,
                    to: adminEmails,
                    subject: `천사손길: 간병인 추천 요청 접수 (${userName})`,
                    html: `
                    <h1>간병인 추천 요청 접수</h1>
                    <p>새로운 간병인 추천 요청이 접수되었습니다. 아래 내용을 확인해주세요.</p>
                    <hr />
                    <p><strong>요청자 성명:</strong> ${userName}</p>
                    <p><strong>요청자 연락처:</strong> ${userPhone}</p>
                    <hr />
                    <h2>요청 내용 상세</h2>
                    <p><strong>돌봄 대상 성별:</strong> ${caregiverInput.patientGender || '미지정'}</p>
                    <p><strong>돌봄 대상 생년월일:</strong> ${caregiverInput.patientBirthDate || '미지정'}</p>
                    <p><strong>돌봄 유형:</strong> ${caregiverInput.careType}</p>
                    <p><strong>희망 날짜:</strong> ${requestedDatesText}</p>
                    <p><strong>희망 시간:</strong> ${caregiverInput.requestedTime || '미지정'}</p>
                    <p><strong>구체적인 필요 사항:</strong></p>
                    <p style="white-space: pre-wrap;">${caregiverInput.specificNeeds}</p>
                    `,
                });
            }
        }
      } catch (error) {
        console.error("[Email Action] A critical error occurred during the recommendation request email process:", error);
      }
  }

  // --- Step 3: Return the recommendations to the user ---
  return result;
}


// --- Email Sending Actions ---

const CaregiverInquirySchema = z.object({
  userName: z.string(),
  userPhone: z.string(),
  caregiverName: z.string(),
  caregiverAge: z.number(),
  caregiverGender: z.string(),
  caregiverPhone: z.string(),
});

export async function submitCaregiverInquiry(data: z.infer<typeof CaregiverInquirySchema>) {
  try {
    const resendApiKey = process.env.CARECONNECT_RESEND_API_KEY;
    if (!resendApiKey || resendApiKey.length < 5) {
      return { success: false, message: '이메일 서비스가 설정되지 않았습니다. 관리자에게 문의해주세요.' };
    }
    const resend = new Resend(resendApiKey);

    const adminEmails = await getAdminEmails();
    if (!adminEmails || adminEmails.length === 0) {
      return { success: false, message: '수신 이메일이 설정되지 않았습니다. 관리자 페이지에서 이메일을 추가해주세요.' };
    }
    
    const fromEmail = process.env.CARECONNECT_EMAIL_FROM || 'onboarding@resend.dev';
    const { userName, userPhone, caregiverName, caregiverAge, caregiverGender, caregiverPhone } = data;

    console.log(`[Email Action] Attempting to send 'Caregiver Inquiry' email.`);
    console.log(` - From: ${fromEmail}`);
    console.log(` - To: ${adminEmails.join(', ')}`);
    console.log(` - Resend Sandbox Note: In sandbox mode, emails can only be sent TO the verified email address used for Resend signup.`);

    const { data: responseData, error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmails,
      subject: `천사손길: 간병인 지정 문의 (${userName})`,
      html: `
        <h1>간병인 지정 문의</h1>
        <p>추천 시스템을 통해 특정 간병인에 대한 문의가 접수되었습니다.</p>
        <hr />
        <h2>문의자 정보</h2>
        <p><strong>성명:</strong> ${userName}</p>
        <p><strong>연락처:</strong> ${userPhone}</p>
        <hr />
        <h2>선택한 간병인 정보</h2>
        <p><strong>성명:</strong> ${caregiverName}</p>
        <p><strong>나이:</strong> ${caregiverAge}세</p>
        <p><strong>성별:</strong> ${caregiverGender}</p>
        <p><strong>연락처:</strong> ${caregiverPhone}</p>
        <hr />
        <p>빠른 시간 내에 문의자에게 연락하여 예약을 확정해주세요.</p>
      `,
    });

    if (error) {
      console.error('[Email Action] Resend API Error in submitCaregiverInquiry:', error);
      if (error.name === 'missing_api_key') {
          return { success: false, message: '이메일 서비스 API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.' };
      }
      if (error.name === 'invalid_api_key') {
        return { success: false, message: '이메일 서비스 API 키가 유효하지 않습니다. .env 파일을 확인해주세요.' };
      }
      if (error.message.includes('You can only send emails to')) {
        return { success: false, message: '테스트 모드에서는 Resend에 가입한 이메일로만 메일을 보낼 수 있습니다. 관리자 이메일 설정을 확인해주세요.' };
      }
      return { success: false, message: '문의 접수 중 오류가 발생했습니다. 서버 로그를 확인해주세요.' };
    }
    
    console.log('[Email Action] "Caregiver Inquiry" email sent successfully. Resend ID:', responseData?.id);
    return { success: true, message: '문의가 성공적으로 접수되었습니다. 곧 연락드리겠습니다.' };

  } catch (error: any) {
    console.error('[Email Action] A critical error occurred in submitCaregiverInquiry:', error);
    if (error.message.toLowerCase().includes('missing api key')) {
        return { success: false, message: '이메일 서비스 API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.' };
    }
    return { success: false, message: '문의 접수 중 심각한 오류가 발생했습니다.' };
  }
}

const InsuranceRequestSchema = z.object({
  patientName: z.string(),
  guardianName: z.string().optional(),
  hospitalName: z.string().optional(),
  phoneNumber: z.string(),
  caregiverName: z.string().optional(),
  servicePeriod: z.string().optional(),
  email: z.string().optional(),
  requestDetails: z.string().optional(),
});

export async function submitInsuranceRequest(data: z.infer<typeof InsuranceRequestSchema>) {
  try {
    const resendApiKey = process.env.CARECONNECT_RESEND_API_KEY;
    if (!resendApiKey || resendApiKey.length < 5) {
      return { success: false, message: '이메일 서비스가 설정되지 않았습니다. 관리자에게 문의해주세요.' };
    }
    const resend = new Resend(resendApiKey);

    const adminEmails = await getAdminEmails();
    if (!adminEmails || adminEmails.length === 0) {
      return { success: false, message: '수신 이메일이 설정되지 않았습니다. 관리자 페이지에서 이메일을 추가해주세요.' };
    }
    
    const fromEmail = process.env.CARECONNECT_EMAIL_FROM || 'onboarding@resend.dev';
    const { patientName, guardianName, hospitalName, phoneNumber, caregiverName, servicePeriod, email, requestDetails } = data;

    console.log(`[Email Action] Attempting to send 'Insurance Request' email.`);
    console.log(` - From: ${fromEmail}`);
    console.log(` - To: ${adminEmails.join(', ')}`);
    console.log(` - Resend Sandbox Note: In sandbox mode, emails can only be sent TO the verified email address used for Resend signup.`);

    const { data: responseData, error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmails,
      reply_to: email,
      subject: `천사손길: 보험서류 요청 (${patientName})`,
      html: `
        <h1>보험서류 요청</h1>
        <p><strong>환자 성명:</strong> ${patientName}</p>
        <p><strong>보호자 성명:</strong> ${guardianName || '기입 안함'}</p>
        <p><strong>병원명:</strong> ${hospitalName || '기입 안함'}</p>
        <p><strong>연락처:</strong> ${phoneNumber}</p>
        <p><strong>간병인 성명:</strong> ${caregiverName || '기입 안함'}</p>
        <p><strong>서비스 기간:</strong> ${servicePeriod || '기입 안함'}</p>
        <p><strong>회신 받을 이메일:</strong> ${email || '기입 안함'}</p>
        <hr />
        <h2>요청 내용:</h2>
        <p style="white-space: pre-wrap;">${requestDetails || '내용 없음'}</p>
      `,
    });

    if (error) {
      console.error('[Email Action] Resend API Error in submitInsuranceRequest:', error);
      if (error.name === 'missing_api_key') {
          return { success: false, message: '이메일 서비스 API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.' };
      }
      if (error.name === 'invalid_api_key') {
        return { success: false, message: '이메일 서비스 API 키가 유효하지 않습니다. .env 파일을 확인해주세요.' };
      }
      if (error.message.includes('You can only send emails to')) {
        return { success: false, message: '테스트 모드에서는 Resend에 가입한 이메일로만 메일을 보낼 수 있습니다. 관리자 이메일 설정을 확인해주세요.' };
      }
      return { success: false, message: '이메일 전송 중 오류가 발생했습니다. 서버 로그를 확인해주세요.' };
    }

    console.log('[Email Action] "Insurance Request" email sent successfully. Resend ID:', responseData?.id);
    return { success: true, message: '보험서류 요청이 성공적으로 접수되었습니다.' };
  } catch (error: any) {
    console.error('[Email Action] A critical error occurred in submitInsuranceRequest:', error);
    if (error.message.toLowerCase().includes('missing api key')) {
        return { success: false, message: '이메일 서비스 API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.' };
    }
    return { success: false, message: '이메일 전송 중 심각한 오류가 발생했습니다.' };
  }
}

const FamilyInsuranceRequestSchema = z.object({
  patientName: z.string(),
  phoneNumber: z.string(),
  familyCaregiverName: z.string().optional(),
  hospitalName: z.string().optional(),
  carePeriod: z.string().optional(),
  email: z.string().optional(),
  requestDetails: z.string().optional(),
});

export async function submitFamilyInsuranceRequest(data: z.infer<typeof FamilyInsuranceRequestSchema>) {
  try {
    const resendApiKey = process.env.CARECONNECT_RESEND_API_KEY;
    if (!resendApiKey || resendApiKey.length < 5) {
      return { success: false, message: '이메일 서비스가 설정되지 않았습니다. 관리자에게 문의해주세요.' };
    }
    const resend = new Resend(resendApiKey);

    const adminEmails = await getAdminEmails();
    if (!adminEmails || adminEmails.length === 0) {
      return { success: false, message: '수신 이메일이 설정되지 않았습니다. 관리자 페이지에서 이메일을 추가해주세요.' };
    }
    
    const fromEmail = process.env.CARECONNECT_EMAIL_FROM || 'onboarding@resend.dev';
    const { patientName, phoneNumber, familyCaregiverName, hospitalName, carePeriod, email, requestDetails } = data;

    const { data: responseData, error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmails,
      reply_to: email,
      subject: `천사손길: 가족 간병인 보험서류 요청 (${patientName})`,
      html: `
        <h1>가족 간병인 보험서류 요청</h1>
        <p><strong>환자 성명:</strong> ${patientName}</p>
        <p><strong>전화번호:</strong> ${phoneNumber}</p>
        <p><strong>가족간병인 성명:</strong> ${familyCaregiverName || '기입 안함'}</p>
        <p><strong>병원명:</strong> ${hospitalName || '기입 안함'}</p>
        <p><strong>간병기간:</strong> ${carePeriod || '기입 안함'}</p>
        <p><strong>회신 받을 이메일:</strong> ${email || '기입 안함'}</p>
        <hr />
        <h2>요청 내용:</h2>
        <p style="white-space: pre-wrap;">${requestDetails || '내용 없음'}</p>
      `,
    });

    if (error) {
      console.error('[Email Action] Resend API Error in submitFamilyInsuranceRequest:', error);
       if (error.name === 'missing_api_key') {
          return { success: false, message: '이메일 서비스 API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.' };
      }
      if (error.name === 'invalid_api_key') {
        return { success: false, message: '이메일 서비스 API 키가 유효하지 않습니다. .env 파일을 확인해주세요.' };
      }
      if (error.message.includes('You can only send emails to')) {
        return { success: false, message: '테스트 모드에서는 Resend에 가입한 이메일로만 메일을 보낼 수 있습니다. 관리자 이메일 설정을 확인해주세요.' };
      }
      return { success: false, message: '이메일 전송 중 오류가 발생했습니다. 서버 로그를 확인해주세요.' };
    }

    console.log('[Email Action] "Family Insurance Request" email sent successfully. Resend ID:', responseData?.id);
    return { success: true, message: '가족 간병인 보험서류 요청이 성공적으로 접수되었습니다.' };

  } catch (error: any) {
    console.error('[Email Action] A critical error occurred in submitFamilyInsuranceRequest:', error);
    if (error.message.toLowerCase().includes('missing api key')) {
        return { success: false, message: '이메일 서비스 API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.' };
    }
    return { success: false, message: '이메일 전송 중 심각한 오류가 발생했습니다.' };
  }
}


const GeneralInquirySchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  message: z.string().optional(),
});

export async function submitGeneralInquiry(data: z.infer<typeof GeneralInquirySchema>) {
  try {
    const resendApiKey = process.env.CARECONNECT_RESEND_API_KEY;
    if (!resendApiKey || resendApiKey.length < 5) {
      return { success: false, message: '이메일 서비스가 설정되지 않았습니다. 관리자에게 문의해주세요.' };
    }
    const resend = new Resend(resendApiKey);
  
    const adminEmails = await getAdminEmails();
    if (!adminEmails || adminEmails.length === 0) {
      return { success: false, message: '수신 이메일이 설정되지 않았습니다. 관리자 페이지에서 이메일을 추가해주세요.' };
    }
    
    const fromEmail = process.env.CARECONNECT_EMAIL_FROM || 'onboarding@resend.dev';
    const { name, phone, email, message } = data;

    console.log(`[Email Action] Attempting to send 'General Inquiry' email.`);
    console.log(` - From: ${fromEmail}`);
    console.log(` - To: ${adminEmails.join(', ')}`);
    console.log(` - Resend Sandbox Note: In sandbox mode, emails can only be sent TO the verified email address used for Resend signup.`);

    const { data: responseData, error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmails,
      reply_to: email,
      subject: `천사손길: 일반 문의 (${name})`,
      html: `
        <h1>일반 문의</h1>
        <p><strong>성함:</strong> ${name}</p>
        <p><strong>연락처:</strong> ${phone}</p>
        <p><strong>회신 받을 이메일:</strong> ${email || '기입 안함'}</p>
        <hr />
        <h2>문의 내용:</h2>
        <p style="white-space: pre-wrap;">${message || '내용 없음'}</p>
      `,
    });

    if (error) {
      console.error('[Email Action] Resend API Error in submitGeneralInquiry:', error);
      if (error.name === 'missing_api_key') {
          return { success: false, message: '이메일 서비스 API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.' };
      }
      if (error.name === 'invalid_api_key') {
        return { success: false, message: '이메일 서비스 API 키가 유효하지 않습니다. .env 파일을 확인해주세요.' };
      }
      if (error.message.includes('You can only send emails to')) {
        return { success: false, message: '테스트 모드에서는 Resend에 가입한 이메일로만 메일을 보낼 수 있습니다. 관리자 이메일 설정을 확인해주세요.' };
      }
      return { success: false, message: '이메일 전송 중 오류가 발생했습니다. 서버 로그를 확인해주세요.' };
    }

    console.log('[Email Action] "General Inquiry" email sent successfully. Resend ID:', responseData?.id);
    return { success: true, message: '문의가 성공적으로 접수되었습니다.' };
  } catch (error: any) {
    console.error('[Email Action] A critical error occurred in submitGeneralInquiry:', error);
    if (error.message.toLowerCase().includes('missing api key')) {
        return { success: false, message: '이메일 서비스 API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.' };
    }
    return { success: false, message: '이메일 전송 중 심각한 오류가 발생했습니다.' };
  }
}

// --- Caregiver Support Application Email Action ---

const SupportApplicationSchema = z.object({
    name: z.string(),
    contact: z.string(),
    region: z.array(z.string()),
    birthDate: z.string(),
    gender: z.string(),
    photoDataUri: z.string().optional(),
    certifications: z.string().optional(),
    experience: z.string(),
    selfIntroduction: z.string().optional(),
});


export async function submitSupportApplicationEmail(data: z.infer<typeof SupportApplicationSchema>) {
    try {
        const resendApiKey = process.env.CARECONNECT_RESEND_API_KEY;
        if (!resendApiKey || resendApiKey.length < 5) {
          return { success: false, message: '이메일 서비스가 설정되지 않았습니다. 관리자에게 문의해주세요.' };
        }
        const resend = new Resend(resendApiKey);

        const adminEmails = await getAdminEmails();
        if (!adminEmails || adminEmails.length === 0) {
            return { success: false, message: '수신 이메일이 설정되지 않았습니다. 관리자 페이지에서 이메일을 추가해주세요.' };
        }

        const fromEmail = process.env.CARECONNECT_EMAIL_FROM || 'onboarding@resend.dev';
        const { name, contact, region, birthDate, gender, photoDataUri, certifications, experience, selfIntroduction } = data;

        let attachments = [];
        if (photoDataUri) {
            const buffer = Buffer.from(photoDataUri.split(',')[1], 'base64');
            attachments.push({
                filename: `${name}_profile.png`,
                content: buffer,
            });
        }
        
        const { data: responseData, error } = await resend.emails.send({
            from: fromEmail,
            to: adminEmails,
            subject: `천사손길: 새로운 간병인 지원서 도착 (${name})`,
            html: `
                <h1>새로운 간병인 지원서</h1>
                <p>새로운 간병인 지원서가 접수되었습니다. 아래 내용을 확인해주세요.</p>
                <hr />
                <h2>지원자 정보</h2>
                <p><strong>성명:</strong> ${name}</p>
                <p><strong>연락처:</strong> ${contact}</p>
                <p><strong>성별:</strong> ${gender}</p>
                <p><strong>생년월일:</strong> ${birthDate}</p>
                <p><strong>근무 가능 지역:</strong> ${region.join(', ')}</p>
                <p><strong>경력:</strong> ${experience}</p>
                <p><strong>보유 자격증:</strong> ${certifications || '기입 안함'}</p>
                <hr />
                <h2>자기소개</h2>
                <p style="white-space: pre-wrap;">${selfIntroduction || '내용 없음'}</p>
            `,
            attachments: attachments,
        });

        if (error) {
            console.error('[Email Action] Resend API Error in submitSupportApplicationEmail:', error);
            // ... (error handling as in other functions)
            return { success: false, message: '지원서 접수 중 오류가 발생했습니다. 서버 로그를 확인해주세요.' };
        }
        
        console.log('[Email Action] "Support Application" email sent successfully. Resend ID:', responseData?.id);
        return { success: true, message: '간병인 지원서가 성공적으로 제출되었습니다. 검토 후 연락드리겠습니다.' };

    } catch (error: any) {
        console.error('[Email Action] A critical error occurred in submitSupportApplicationEmail:', error);
        if (error.message.toLowerCase().includes('missing api key')) {
            return { success: false, message: '이메일 서비스 API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.' };
        }
        return { success: false, message: '지원서 접수 중 심각한 오류가 발생했습니다.' };
    }
}
