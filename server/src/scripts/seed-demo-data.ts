/**
 * Demo Data Seeding Script
 * Creates sample data for a clean demo presentation
 */

import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole, LeadStatus, ProjectStatus } from '@prisma/client';

async function seedDemoData() {
  console.log('🌱 Starting demo data seeding...');

  try {
    // 1. Create demo users
    console.log('Creating demo users...');
    const demoPassword = await bcrypt.hash('Demo123!', 10);
    
    const contractor = await prisma.user.upsert({
      where: { email: 'demo@contractorcrm.com' },
      update: {},
      create: {
        email: 'demo@contractorcrm.com',
        passwordHash: demoPassword,
        name: 'Demo Contractor',
        company: 'Demo Construction LLC',
        phone: '(555) 123-4567',
        role: UserRole.CONTRACTOR,
      },
    });
    console.log('✓ Demo contractor created:', contractor.email);

    // 2. Create sample leads
    console.log('Creating sample leads...');
    const leads = await Promise.all([
      prisma.lead.create({
        data: {
          userId: contractor.id,
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '(555) 234-5678',
          street: '123 Main Street',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          fullAddress: '123 Main Street, Los Angeles, CA 90001',
          status: LeadStatus.NEW,
          source: 'Website',
          leadScore: 85,
          renovationPotential: 90,
          ownerMotivation: 80,
          profitPotential: 85,
          notes: 'Interested in kitchen remodel. Budget: $50-75k',
        },
      }),
      prisma.lead.create({
        data: {
          userId: contractor.id,
          name: 'Sarah Johnson',
          email: 'sarah.j@example.com',
          phone: '(555) 345-6789',
          street: '456 Oak Avenue',
          city: 'San Diego',
          state: 'CA',
          zipCode: '92101',
          fullAddress: '456 Oak Avenue, San Diego, CA 92101',
          status: LeadStatus.CONTACTED,
          source: 'Referral',
          leadScore: 92,
          renovationPotential: 95,
          ownerMotivation: 90,
          profitPotential: 90,
          notes: 'Bathroom and master bedroom addition. High-end finishes.',
        },
      }),
      prisma.lead.create({
        data: {
          userId: contractor.id,
          name: 'Michael Chen',
          email: 'mchen@example.com',
          phone: '(555) 456-7890',
          street: '789 Pine Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          fullAddress: '789 Pine Street, San Francisco, CA 94102',
          status: LeadStatus.QUALIFIED,
          source: 'Cold Call',
          leadScore: 78,
          renovationPotential: 75,
          ownerMotivation: 70,
          profitPotential: 80,
          notes: 'Deck replacement and backyard landscaping.',
        },
      }),
    ]);
    console.log(`✓ Created ${leads.length} sample leads`);

    // 3. Create a sample project from one lead
    console.log('Creating sample project...');
    const project = await prisma.project.create({
      data: {
        userId: contractor.id,
        leadId: leads[1].id, // Sarah Johnson's lead
        name: 'Johnson Residence - Bathroom & Bedroom Addition',
        description: 'Complete bathroom remodel and master bedroom addition with high-end finishes',
        street: leads[1].street,
        city: leads[1].city,
        state: leads[1].state,
        zipCode: leads[1].zipCode,
        status: ProjectStatus.PLANNING,
        estimatedBudget: 125000,
        estimatedDays: 90,
      },
    });
    
    // Update lead status
    await prisma.lead.update({
      where: { id: leads[1].id },
      data: { status: LeadStatus.WON },
    });
    console.log('✓ Sample project created:', project.name);

    // 4. Create sample subcontractors
    console.log('Creating sample subcontractors...');
    const subcontractors = await Promise.all([
      prisma.subcontractor.create({
        data: {
          name: 'Mike Wilson',
          email: 'mike.plumbing@example.com',
          phone: '(555) 111-2222',
          company: 'Wilson Plumbing Services',
          trades: ['Plumbing'],
          specialization: 'Residential Plumbing',
          bio: '15 years of experience in residential plumbing. Licensed and insured.',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          latitude: 34.0522,
          longitude: -118.2437,
          serviceRadius: 50,
          rating: 4.8,
          reviewCount: 127,
          completedJobs: 234,
          available: true,
          hourlyRate: 85,
          verified: true,
          insurance: true,
          licenseNumber: 'CA-PL-12345',
        },
      }),
      prisma.subcontractor.create({
        data: {
          name: 'David Martinez',
          email: 'david.electric@example.com',
          phone: '(555) 222-3333',
          company: 'Martinez Electrical',
          trades: ['Electrical'],
          specialization: 'Commercial & Residential Electrical',
          bio: 'Master electrician with 20+ years experience. All work guaranteed.',
          city: 'San Diego',
          state: 'CA',
          zipCode: '92101',
          latitude: 32.7157,
          longitude: -117.1611,
          serviceRadius: 40,
          rating: 4.9,
          reviewCount: 203,
          completedJobs: 456,
          available: true,
          hourlyRate: 95,
          dailyRate: 760,
          verified: true,
          insurance: true,
          licenseNumber: 'CA-EL-67890',
        },
      }),
      prisma.subcontractor.create({
        data: {
          name: 'Jennifer Lee',
          email: 'jen.tile@example.com',
          phone: '(555) 333-4444',
          company: 'Lee Tile & Stone',
          trades: ['Tile Work', 'Flooring'],
          specialization: 'Custom Tile & Stone Installation',
          bio: 'Specializing in high-end tile work, natural stone, and custom patterns.',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90015',
          latitude: 34.0407,
          longitude: -118.2468,
          serviceRadius: 35,
          rating: 4.95,
          reviewCount: 89,
          completedJobs: 167,
          available: true,
          hourlyRate: 75,
          verified: true,
          insurance: true,
          licenseNumber: 'CA-TL-45678',
        },
      }),
    ]);
    console.log(`✓ Created ${subcontractors.length} sample subcontractors`);

    // 5. Create sample tasks
    console.log('Creating sample tasks...');
    const tasks = await Promise.all([
      prisma.task.create({
        data: {
          userId: contractor.id,
          leadId: leads[0].id,
          title: 'Follow up with John Smith',
          description: 'Discuss kitchen remodel timeline and budget',
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          status: 'PENDING',
        },
      }),
      prisma.task.create({
        data: {
          userId: contractor.id,
          projectId: project.id,
          title: 'Get electrical permit',
          description: 'Apply for electrical permit for Johnson project',
          priority: 'URGENT',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          status: 'PENDING',
        },
      }),
      prisma.task.create({
        data: {
          userId: contractor.id,
          projectId: project.id,
          title: 'Order bathroom fixtures',
          description: 'Order sink, toilet, shower fixtures from supplier',
          priority: 'MEDIUM',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          status: 'PENDING',
        },
      }),
    ]);
    console.log(`✓ Created ${tasks.length} sample tasks`);

    console.log('\n✅ Demo data seeding completed successfully!');
    console.log('\nDemo Login Credentials:');
    console.log('  Email: demo@contractorcrm.com');
    console.log('  Password: Demo123!');
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
}

// Run the seeding
seedDemoData()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
