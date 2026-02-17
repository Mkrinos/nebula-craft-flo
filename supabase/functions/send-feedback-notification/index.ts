import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeatureRatings {
  visualDesign?: number;
  easeOfUse?: number;
  funFactor?: number;
  performance?: number;
  coolFactor?: number;
}

interface ConcernRatings {
  screenTime?: number;
  contentSafety?: number;
  dataSecurity?: number;
  ageAppropriateness?: number;
  educationalValue?: number;
}

interface FeedbackNotificationRequest {
  feedbackType: string;
  sessionId: string;
  deviceType?: string;
  language?: string;
  // Young Explorer fields
  ageGroup?: string;
  experienceRating?: number;
  featureRatings?: FeatureRatings;
  lovedFeatures?: string[];
  lovedOther?: string;
  improvements?: string[];
  improvementsOther?: string;
  dreamFeature?: string;
  timeSpent?: string;
  wouldReturn?: string;
  // Parent/Guardian fields
  childAgeGroup?: string;
  heardFrom?: string;
  firstImpressions?: string[];
  firstImpressionsOther?: string;
  expectedPrice?: string;
  primaryValue?: string[];
  primaryValueOther?: string;
  overallSatisfaction?: number;
  concernRatings?: ConcernRatings;
  safetyFeatureRanking?: string[];
  childEngagement?: string[];
  otherPlatforms?: string[];
  otherPlatformsOther?: string;
  platformComparison?: string;
  featurePriorities?: string[];
  featureSuggestions?: string;
  signupLikelihood?: string;
  recommendLikelihood?: string;
  questionsAndConcerns?: string;
  contactEmail?: string;
  contactFrequency?: string;
}

const formatRating = (rating: number | undefined, max: number = 5): string => {
  if (rating === undefined) return 'Not provided';
  const stars = '★'.repeat(rating) + '☆'.repeat(max - rating);
  return `${stars} (${rating}/${max})`;
};

const formatSliderRating = (rating: number | undefined): string => {
  if (rating === undefined) return 'Not provided';
  return `${rating}/10`;
};

const formatList = (items: string[] | undefined, other?: string): string => {
  if (!items || items.length === 0) {
    return other ? other : 'None selected';
  }
  const formatted = items.join(', ');
  return other ? `${formatted}, Other: ${other}` : formatted;
};

const formatTimeSpent = (value: string | undefined): string => {
  const map: Record<string, string> = {
    'quick': 'Quick look (< 5 minutes)',
    'moderate': 'Moderate exploration (5-15 minutes)',
    'deep': 'Deep dive (15+ minutes)'
  };
  return value ? (map[value] || value) : 'Not provided';
};

const formatWouldReturn = (value: string | undefined): string => {
  const map: Record<string, string> = {
    'definitely': 'Definitely yes!',
    'probably': 'Probably',
    'maybe': 'Maybe',
    'unlikely': 'Unlikely'
  };
  return value ? (map[value] || value) : 'Not provided';
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: FeedbackNotificationRequest = await req.json();
    
    console.log("Received feedback notification request:", JSON.stringify(data, null, 2));

    const isYoungExplorer = data.feedbackType === 'young_explorer';
    const feedbackTypeLabel = isYoungExplorer ? 'Young Explorer' : 'Parent/Guardian';

    let emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .header .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; margin-top: 10px; font-size: 14px; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .section h2 { margin: 0 0 15px 0; font-size: 16px; color: #6b21a8; border-bottom: 2px solid #e9d5ff; padding-bottom: 10px; }
          .field { margin-bottom: 12px; }
          .field-label { font-weight: 600; color: #4b5563; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
          .field-value { color: #1f2937; margin-top: 4px; }
          .rating { font-size: 16px; color: #f59e0b; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; }
          .tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
          .tag { background: #e9d5ff; color: #6b21a8; padding: 4px 12px; border-radius: 15px; font-size: 13px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .meta-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
          .meta-item { text-align: center; padding: 10px; background: #f3f4f6; border-radius: 6px; }
          .meta-item .label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
          .meta-item .value { font-weight: 600; color: #374151; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚀 New Feedback Received!</h1>
          <div class="badge">${feedbackTypeLabel} Feedback</div>
        </div>
        <div class="content">
          <div class="section">
            <h2>📋 Session Information</h2>
            <div class="meta-info">
              <div class="meta-item">
                <div class="label">Session ID</div>
                <div class="value">${data.sessionId}</div>
              </div>
              <div class="meta-item">
                <div class="label">Device</div>
                <div class="value">${data.deviceType || 'Unknown'}</div>
              </div>
              <div class="meta-item">
                <div class="label">Language</div>
                <div class="value">${data.language?.toUpperCase() || 'EN'}</div>
              </div>
            </div>
          </div>
    `;

    if (isYoungExplorer) {
      // Young Explorer specific content
      emailHtml += `
          <div class="section">
            <h2>👤 Explorer Profile</h2>
            <div class="field">
              <div class="field-label">Age Group</div>
              <div class="field-value">${data.ageGroup || 'Not provided'}</div>
            </div>
          </div>

          <div class="section">
            <h2>⭐ Overall Experience</h2>
            <div class="field">
              <div class="field-label">Experience Rating</div>
              <div class="field-value rating">${formatRating(data.experienceRating)}</div>
            </div>
          </div>
      `;

      if (data.featureRatings) {
        emailHtml += `
          <div class="section">
            <h2>📊 Feature Ratings (out of 10)</h2>
            <div class="field">
              <div class="field-label">Visual Design</div>
              <div class="field-value">${formatSliderRating(data.featureRatings.visualDesign)}</div>
            </div>
            <div class="field">
              <div class="field-label">Ease of Use</div>
              <div class="field-value">${formatSliderRating(data.featureRatings.easeOfUse)}</div>
            </div>
            <div class="field">
              <div class="field-label">Fun Factor</div>
              <div class="field-value">${formatSliderRating(data.featureRatings.funFactor)}</div>
            </div>
            <div class="field">
              <div class="field-label">Performance</div>
              <div class="field-value">${formatSliderRating(data.featureRatings.performance)}</div>
            </div>
            <div class="field">
              <div class="field-label">Cool Factor</div>
              <div class="field-value">${formatSliderRating(data.featureRatings.coolFactor)}</div>
            </div>
          </div>
        `;
      }

      emailHtml += `
          <div class="section">
            <h2>💜 What They Loved</h2>
            <div class="field">
              <div class="field-label">Selected Features</div>
              <div class="tags">
                ${(data.lovedFeatures || []).map(f => `<span class="tag">${f}</span>`).join('')}
              </div>
              ${data.lovedOther ? `<div class="field-value" style="margin-top: 10px;"><strong>Other:</strong> ${data.lovedOther}</div>` : ''}
            </div>
          </div>

          <div class="section">
            <h2>🔧 Suggested Improvements</h2>
            <div class="field">
              <div class="field-label">Selected Areas</div>
              <div class="tags">
                ${(data.improvements || []).map(f => `<span class="tag">${f}</span>`).join('')}
              </div>
              ${data.improvementsOther ? `<div class="field-value" style="margin-top: 10px;"><strong>Other:</strong> ${data.improvementsOther}</div>` : ''}
            </div>
          </div>
      `;

      if (data.dreamFeature) {
        emailHtml += `
          <div class="section highlight">
            <h2>✨ Dream Feature</h2>
            <div class="field-value">"${data.dreamFeature}"</div>
          </div>
        `;
      }

      emailHtml += `
          <div class="section">
            <h2>⏱️ Engagement</h2>
            <div class="field">
              <div class="field-label">Time Spent</div>
              <div class="field-value">${formatTimeSpent(data.timeSpent)}</div>
            </div>
            <div class="field">
              <div class="field-label">Would Return</div>
              <div class="field-value">${formatWouldReturn(data.wouldReturn)}</div>
            </div>
          </div>
      `;
    } else {
      // Parent/Guardian specific content
      emailHtml += `
          <div class="section">
            <h2>👨‍👩‍👧 Family Profile</h2>
            <div class="field">
              <div class="field-label">Child's Age Group</div>
              <div class="field-value">${data.childAgeGroup || 'Not provided'}</div>
            </div>
            <div class="field">
              <div class="field-label">How They Heard About Us</div>
              <div class="field-value">${data.heardFrom || 'Not provided'}</div>
            </div>
          </div>

          <div class="section">
            <h2>💭 First Impressions</h2>
            <div class="tags">
              ${(data.firstImpressions || []).map(f => `<span class="tag">${f}</span>`).join('')}
            </div>
            ${data.firstImpressionsOther ? `<div class="field-value" style="margin-top: 10px;"><strong>Other:</strong> ${data.firstImpressionsOther}</div>` : ''}
          </div>

          <div class="section">
            <h2>💰 Value Assessment</h2>
            <div class="field">
              <div class="field-label">Expected Price</div>
              <div class="field-value">${data.expectedPrice || 'Not provided'}</div>
            </div>
            <div class="field">
              <div class="field-label">Primary Value</div>
              <div class="tags">
                ${(data.primaryValue || []).map(f => `<span class="tag">${f}</span>`).join('')}
              </div>
              ${data.primaryValueOther ? `<div class="field-value" style="margin-top: 10px;"><strong>Other:</strong> ${data.primaryValueOther}</div>` : ''}
            </div>
          </div>

          <div class="section">
            <h2>⭐ Satisfaction</h2>
            <div class="field">
              <div class="field-label">Overall Satisfaction</div>
              <div class="field-value rating">${formatRating(data.overallSatisfaction)}</div>
            </div>
          </div>
      `;

      if (data.concernRatings) {
        emailHtml += `
          <div class="section">
            <h2>⚠️ Concern Levels (1-5, lower is better)</h2>
            <div class="field">
              <div class="field-label">Screen Time</div>
              <div class="field-value">${data.concernRatings.screenTime || 'Not rated'}/5</div>
            </div>
            <div class="field">
              <div class="field-label">Content Safety</div>
              <div class="field-value">${data.concernRatings.contentSafety || 'Not rated'}/5</div>
            </div>
            <div class="field">
              <div class="field-label">Data Security</div>
              <div class="field-value">${data.concernRatings.dataSecurity || 'Not rated'}/5</div>
            </div>
            <div class="field">
              <div class="field-label">Age Appropriateness</div>
              <div class="field-value">${data.concernRatings.ageAppropriateness || 'Not rated'}/5</div>
            </div>
            <div class="field">
              <div class="field-label">Educational Value</div>
              <div class="field-value">${data.concernRatings.educationalValue || 'Not rated'}/5</div>
            </div>
          </div>
        `;
      }

      if (data.safetyFeatureRanking && data.safetyFeatureRanking.length > 0) {
        emailHtml += `
          <div class="section">
            <h2>🛡️ Safety Feature Priority (Ranked)</h2>
            <ol style="margin: 0; padding-left: 20px;">
              ${data.safetyFeatureRanking.map((f, i) => `<li>${f}</li>`).join('')}
            </ol>
          </div>
        `;
      }

      emailHtml += `
          <div class="section">
            <h2>🎮 Child Engagement</h2>
            <div class="tags">
              ${(data.childEngagement || []).map(f => `<span class="tag">${f}</span>`).join('')}
            </div>
          </div>

          <div class="section">
            <h2>🏆 Competitive Landscape</h2>
            <div class="field">
              <div class="field-label">Other Platforms Used</div>
              <div class="tags">
                ${(data.otherPlatforms || []).map(f => `<span class="tag">${f}</span>`).join('')}
              </div>
              ${data.otherPlatformsOther ? `<div class="field-value" style="margin-top: 10px;"><strong>Other:</strong> ${data.otherPlatformsOther}</div>` : ''}
            </div>
            ${data.platformComparison ? `
            <div class="field" style="margin-top: 15px;">
              <div class="field-label">Comparison Notes</div>
              <div class="field-value">"${data.platformComparison}"</div>
            </div>
            ` : ''}
          </div>
      `;

      if (data.featurePriorities && data.featurePriorities.length > 0) {
        emailHtml += `
          <div class="section">
            <h2>📋 Feature Priorities (Ranked)</h2>
            <ol style="margin: 0; padding-left: 20px;">
              ${data.featurePriorities.map((f, i) => `<li>${f}</li>`).join('')}
            </ol>
          </div>
        `;
      }

      if (data.featureSuggestions) {
        emailHtml += `
          <div class="section highlight">
            <h2>💡 Feature Suggestions</h2>
            <div class="field-value">"${data.featureSuggestions}"</div>
          </div>
        `;
      }

      emailHtml += `
          <div class="section">
            <h2>📈 Likelihood</h2>
            <div class="field">
              <div class="field-label">Signup Likelihood</div>
              <div class="field-value">${data.signupLikelihood || 'Not provided'}</div>
            </div>
            <div class="field">
              <div class="field-label">Recommend Likelihood</div>
              <div class="field-value">${data.recommendLikelihood || 'Not provided'}</div>
            </div>
          </div>
      `;

      if (data.questionsAndConcerns) {
        emailHtml += `
          <div class="section">
            <h2>❓ Questions & Concerns</h2>
            <div class="field-value">"${data.questionsAndConcerns}"</div>
          </div>
        `;
      }

      if (data.contactEmail) {
        emailHtml += `
          <div class="section" style="background: #ecfdf5; border: 1px solid #10b981;">
            <h2 style="color: #059669;">📧 Contact Information</h2>
            <div class="field">
              <div class="field-label">Email</div>
              <div class="field-value"><a href="mailto:${data.contactEmail}">${data.contactEmail}</a></div>
            </div>
            <div class="field">
              <div class="field-label">Preferred Contact Frequency</div>
              <div class="field-value">${data.contactFrequency || 'Not specified'}</div>
            </div>
          </div>
        `;
      }
    }

    emailHtml += `
        </div>
        <div class="footer">
          <p>This notification was sent automatically from MX2K Feedback System</p>
          <p>Submitted at: ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC</p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "MX2K Feedback <onboarding@resend.dev>",
      to: ["mkrinos227@gmail.com"],
      subject: `🚀 New ${feedbackTypeLabel} Feedback - ${data.sessionId}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-feedback-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
