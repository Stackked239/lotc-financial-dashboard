export default function DonationsSocial() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-black">Donations & Social Media</h2>
        <p className="text-brand-grey mt-1">Live dashboard tracking donations and social media engagement</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <iframe
          src="https://embed.domo.com/embed/pages/WQ7Y4"
          width="100%"
          height="1620"
          frameBorder="0"
          className="block w-full"
          title="Donations and Social Media Dashboard"
        />
      </div>
    </div>
  );
}
