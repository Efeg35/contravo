import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface NotificationEmailProps {
  baslik: string;
  mesaj: string;
  link: string;
  linkText?: string;
}

export const NotificationEmail = ({
  baslik,
  mesaj,
  link,
  linkText = 'Detayları Gör',
}: NotificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{baslik}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://contravo.com/logo.png"
            width="150"
            height="50"
            alt="Contravo"
            style={logo}
          />
          <Heading style={h1}>{baslik}</Heading>
          <Text style={text}>{mesaj}</Text>
          <Section style={buttonContainer}>
            <Button style={button} href={link}>
              {linkText}
            </Button>
          </Section>
          <Text style={footer}>
            Bu e-posta Contravo tarafından otomatik olarak gönderilmiştir.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const logo = {
  margin: '0 auto',
  marginBottom: '24px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  padding: '0 40px',
  margin: '0 0 20px',
};

const text = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '1.5',
  padding: '0 40px',
  margin: '0 0 20px',
};

const buttonContainer = {
  padding: '0 40px',
  margin: '0 0 20px',
};

const button = {
  backgroundColor: '#0070f3',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '1.5',
  padding: '0 40px',
  margin: '0',
};

export default NotificationEmail; 