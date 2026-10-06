import { Seo } from '@/components/Seo'
import { APP_NAME, APP_SHORT_NAME, COMPANY_NAME } from '@/utils/constants'

export function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Seo title="Terms of use" description={`Terms of use for ${APP_NAME} educational content.`} />
      <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Terms of use</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        {APP_NAME} is an educational service of {COMPANY_NAME}. By creating an account you confirm that you are 18 or older and that you understand the content is for learning only.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-muted">
        <li>Courses do not constitute investment advice or a personal recommendation.</li>
        <li>Certificates record completion of educational material. They are not a professional licence.</li>
        <li>This demonstration stores account and progress data in your browser until a backend is connected.</li>
        <li>Trading forex and CFDs involves significant risk and may not be suitable for all investors.</li>
      </ul>
    </div>
  )
}

export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Seo title="Privacy policy" description={`How ${APP_NAME} handles account information in this educational demonstration.`} />
      <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Privacy policy</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        In this demonstration, registration details and learning progress are stored locally in your browser using localStorage. When a production API is connected, those records will move to secured servers operated by {COMPANY_NAME}.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        We collect name, email, mobile number, country, and learning activity to operate the Academy. We do not sell educational records. You can request deletion of a live account through official {APP_SHORT_NAME} support channels once the backend is live.
      </p>
    </div>
  )
}
