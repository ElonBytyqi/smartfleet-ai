using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Application.Services
{
    public interface ITokenService
    {
        string GenerateAccessToken(Guid userId, string email, IList<string> roles);
        string GenerateRefreshToken();


    }
}
