import { CredentialResponse, GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"
import * as React from "react"
import { SupabaseClient } from "@supabase/supabase-js"
import { Col, Row, Typography, Alert, AlertProps } from "antd"
import awardwizImageUrl from "../wizard.png"
const { Title } = Typography

const supabase = new SupabaseClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

export const LoginScreen = ({ children }: { children: JSX.Element }) => {
  const [message, setMessage] = React.useState<{type: AlertProps["type"], text: string}>({ type: undefined, text: "" })
  const [supabaseSession, setSupabaseSession] = React.useState(supabase.auth.session())

  React.useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => { setSupabaseSession(session) })
  }, [])

  React.useEffect(() => {
    console.log(`Logged in as ${supabaseSession?.user?.email || "(not logged in)"}`)
  }, [supabaseSession])

  const onGoogleCredential = async (credentialResponse: CredentialResponse) => {
    console.log("Google credential received, logging into Supabase...")
    if (!credentialResponse.credential || !credentialResponse.clientId) { setMessage({ type: "error", text: "Failed to log in with Google" }); return }

    const { data, error } = await supabase.auth.api.signInWithOpenIDConnect({ id_token: credentialResponse.credential, nonce: "", client_id: credentialResponse.clientId, issuer: "https://accounts.google.com", provider: "google" })
    if (error) { setMessage({ type: "error", text: error.message }); return }
    if (!data?.user?.email) { setMessage({ type: "error", text: "Could not get email address from auth provider" }); return }

    // @ts-ignore (needed because of the nonce hack in signInWithOpenIDConnect above)
    // eslint-disable-next-line no-underscore-dangle
    supabase.auth._saveSession(data); supabase.auth._notifyAllSubscribers("SIGNED_IN")
  }

  if (supabaseSession)
    return children

  return (
    <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
      <Col>
        <Row justify="center" style={{ paddingBottom: 5 }}>
          <img alt="AwardWiz logo" src={awardwizImageUrl} style={{ width: 100 }} />
        </Row>
        <Row justify="center">
          <Title level={2}>AwardWiz</Title>
        </Row>
        <Row justify="center">
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={onGoogleCredential}
              onError={() => setMessage({ type: "error", text: "Couldn't log into Google" })}
            />
          </GoogleOAuthProvider>
        </Row>
        { message.type !== undefined && (
          <Row justify="center">
            <Alert style={{ marginTop: 10 }} message={message.text} type={message.type} showIcon />
          </Row>
        )}
      </Col>
    </Row>
  )
}