import Link from "next/link";

import styled from "styled-components";
import React, { useState } from "react";

import Head from "next/head";
import Header from "../../src/components/Header";
import { useAuth } from "../../src/context/AuthContext";

const Container = styled.div`
  width: 500px;
  height: 700px;
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 48px;
  margin: 0 auto;
  margin-top: 100px;
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  row-gap: 12px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: bold;
  text-align: center;
  text-transform: uppercase;
`;

const Input = styled.input`
  font-size: 15px;
  width: 100%;
  height: 48px;
  border: none;
  padding: 0 12px;
  border-radius: 10px;
  /* background-color: #535353; */
`;

const Button = styled.button`
  font-weight: bold;
  width: 100%;
  height: 48px;
  border-radius: 10px;
  border: none;
  text-transform: uppercase;
  cursor: pointer;
  color: white;
  background-color: #535353;
`;

const Switch = styled.div`
  font-size: 12px;
  text-align: center;
`;

export default function Login() {
  const { login } = useAuth();

  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await login(data.email, data.password);
    } catch (err) {
      console.log(err);
      alert("登入資訊有誤");
    }
  };

  return (
    <>
      <Head>
        <title>Login | Online DAW</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/logo-pattern.svg" />
      </Head>
      <Header />
      <Container>
        <Title>login</Title>
        <Form onSubmit={handleLogin}>
          <Input
            id="email-address"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData({
                ...data,
                email: e.target.value,
              })
            }
            value={data.email}
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Email Address"
          />
          <Input
            id="password"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData({
                ...data,
                password: e.target.value,
              })
            }
            value={data.password}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Password"
          />
          <Button type="submit">login</Button>
        </Form>
        <Link href="/signup">
          <Switch>Create account</Switch>
        </Link>
      </Container>
    </>
  );
}
