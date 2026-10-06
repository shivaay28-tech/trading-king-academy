import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/context/AuthContext'
import { progressService } from '@/services/progress'
import { APP_NAME, DISCLAIMER } from '@/utils/constants'
import { formatDateLong } from '@/utils/format'
import { Award } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

export function CertificatesPage() {
  const { user } = useAuth()
  const records = user ? progressService.certificatesFor(user.id) : []

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Seo title="Certificates" description={`Sample completion certificates issued by ${APP_NAME}.`} />
      <h1 className="text-3xl font-extrabold text-ink">Certificates</h1>
      {records.length ? (
        <div className="mt-6 grid gap-4">
          {records.map((item) => (
            <Link key={item.id} to={`/certificates/${item.id}`} className="rounded-2xl panel p-5 hover:border-baazex/30">
              <p className="text-sm font-bold text-ink">{item.courseName}</p>
              <p className="mt-1 text-xs text-muted">
                {item.id} · {formatDateLong(item.completedAt)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState icon={Award} title="No certificates yet" description="Complete every lesson and pass the course quiz at 70% or higher." />
        </div>
      )}
    </div>
  )
}

export function CertificatePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const record = user ? progressService.certificatesFor(user.id).find((item) => item.id === id) : undefined

  if (!record) {
    return (
      <div className="px-4 py-16">
        <EmptyState icon={Award} title="Certificate not found" description="Complete a course quiz after finishing the lessons to issue a sample certificate." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Seo title="Certificate" description={`Completion certificate for ${record.courseName}.`} />
      <div className="mb-4 flex justify-end gap-2 no-print">
        <Button variant="secondary" onClick={() => navigate('/certificates')}>
          All certificates
        </Button>
        <Button onClick={() => window.print()}>Download certificate</Button>
      </div>
      <article className="print-certificate relative overflow-hidden rounded-[28px] border-4 border-[#10203a] bg-[#f6f8fc] p-8 text-[#10203a] sm:p-12">
        <div className="absolute inset-3 rounded-[22px] border border-baazex/30" />
        <div className="relative text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <p className="mt-8 text-xs font-bold tracking-[0.28em] text-accent uppercase">Certificate of completion</p>
          <h1 className="mt-4 font-serif text-4xl text-ink sm:text-5xl">{APP_NAME}</h1>
          <p className="mt-8 text-sm text-muted">This is to certify that</p>
          <p className="mt-2 font-serif text-3xl text-ink">{record.studentName}</p>
          <p className="mt-6 text-sm text-muted">has completed the educational course</p>
          <p className="mt-2 text-xl font-bold text-ink">{record.courseName}</p>
          <div className="mx-auto mt-10 grid max-w-lg gap-6 text-left sm:grid-cols-2">
            <div>
              <p className="text-[11px] tracking-[0.16em] text-muted uppercase">Completion date</p>
              <p className="mt-1 font-semibold text-ink">{formatDateLong(record.completedAt)}</p>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.16em] text-muted uppercase">Certificate ID</p>
              <p className="mt-1 font-semibold text-ink">{record.id}</p>
            </div>
          </div>
          <p className="mx-auto mt-10 max-w-xl text-[11px] leading-relaxed text-muted">{DISCLAIMER}</p>
          <p className="mt-4 text-[11px] text-muted">This certificate records educational completion only. It is not a professional licence or trading qualification.</p>
        </div>
      </article>
    </div>
  )
}
