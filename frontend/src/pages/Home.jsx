import React from 'react';
import Hero from '../components/Hero';
import EventDetails from '../components/EventDetails';

export default function Home({ onOpenTicketModal }) {
  return (
    <div className="space-y-6">
      <Hero onOpenTicketModal={onOpenTicketModal} />
      <EventDetails onOpenTicketModal={onOpenTicketModal} />
    </div>
  );
}
