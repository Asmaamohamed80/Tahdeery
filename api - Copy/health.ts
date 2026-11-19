interface Req {
  method?: string;
}

interface Res {
  status: (code: number) => { json: (data: unknown) => void };
}

export default function handler(_req: Req, res: Res) {
  res.status(200).json({ status: 'ok' });
}
