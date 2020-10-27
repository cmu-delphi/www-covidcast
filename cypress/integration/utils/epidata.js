const states = 'al,ak,az,ar,ca,co,ct,de,dc,fl,ga,hi,id,il,in,ia,ks,ky,la,me,md,ma,mi,mn,ms,mo,mt,ne,nh,nj,nm,ny,nc,nd,oh,ok,or,pa,ri,sc,sd,tn,tx,ut,vt,va,wa,wv,wi,wy,pr'.split(
  ',',
);

export function wrapEpiStructure(rows) {
  if (!rows) {
    return {
      body: {
        result: -1,
        epidata: [],
        message: 'error',
      },
    };
  }
  if (rows.length === 0) {
    return {
      body: {
        result: -2,
        epidata: [],
        message: 'no results',
      },
    };
  }
  return {
    body: {
      result: 1,
      epidata: rows,
      message: 'success',
    },
  };
}
